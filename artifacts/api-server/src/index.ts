import app from "./app";
import { logger } from "./lib/logger";
import { sendWeeklySummary } from "./lib/adminEmail";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  if (!process.env.REPL_ID) {
    logger.info("No REPL_ID found, skipping Stripe init");
    return;
  }
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    await runMigrations({ databaseUrl: process.env.DATABASE_URL! });

    const { getStripeSync } = await import("./stripeClient");
    const stripeSync = await getStripeSync();

    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    if (domain) {
      await stripeSync.findOrCreateManagedWebhook(
        `https://${domain}/api/stripe/webhook`,
      );
    }

    stripeSync.syncBackfill().catch((err: unknown) => {
      logger.error({ err }, "Stripe backfill error");
    });

    logger.info("Stripe initialised");
  } catch (err) {
    logger.error({ err }, "Stripe init failed — continuing without Stripe");
  }
}

await initStripe();

async function runExpiredListingCleanup() {
  try {
    const { db, listingsTable } = await import("@workspace/db");
    const { lt, eq, and } = await import("drizzle-orm");
    const now = new Date();
    const result = await db
      .update(listingsTable)
      .set({ status: "deleted" })
      .where(
        and(
          lt(listingsTable.expiryDate, now),
          eq(listingsTable.status, "active"),
        ),
      );
    logger.info({ result }, "Expired listing cleanup ran");
  } catch (err) {
    logger.error({ err }, "Expired listing cleanup failed");
  }
}

await runExpiredListingCleanup();
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
setInterval(runExpiredListingCleanup, CLEANUP_INTERVAL_MS);

// --- Old sponsored-ad cleanup (runs every 24 h) ---
async function runExpiredAdCleanup() {
  try {
    const { db, sponsoredAdsTable } = await import("@workspace/db");
    const { sql, lt, eq, and } = await import("drizzle-orm");
    // Delete ads whose weekStart is older than 2 full weeks ago
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const cutoff = twoWeeksAgo.toISOString().split("T")[0]!;
    const result = await db
      .delete(sponsoredAdsTable)
      .where(
        and(
          eq(sponsoredAdsTable.status, "approved"),
          sql`${sponsoredAdsTable.weekStart} < ${cutoff}`,
        ),
      );
    logger.info({ result }, "Old sponsored-ad cleanup ran");
  } catch (err) {
    logger.error({ err }, "Old sponsored-ad cleanup failed");
  }
}

await runExpiredAdCleanup();
setInterval(runExpiredAdCleanup, 24 * 60 * 60 * 1000);

// --- Weekly summary email (Sunday → Monday, 23:30 UTC) ---
async function runWeeklySummary() {
  try {
    const { db } = await import("@workspace/db");
    const { sql } = await import("drizzle-orm");

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { rows: uRows } = await db.execute(
      sql`SELECT COUNT(*)::int AS cnt FROM users WHERE created_at >= ${weekAgo}`,
    );
    const { rows: lRows } = await db.execute(
      sql`SELECT COUNT(*)::int AS cnt FROM listings WHERE created_at >= ${weekAgo}`,
    );

    const newUsers = Number((uRows[0] as any)?.cnt ?? 0);
    const newListings = Number((lRows[0] as any)?.cnt ?? 0);
    const fmt = (d: Date) => d.toISOString().split("T")[0]!;

    await sendWeeklySummary({
      newUsers,
      newListings,
      weekStart: fmt(weekAgo),
      weekEnd: fmt(now),
    });

    logger.info("Weekly summary email sent");
  } catch (err) {
    logger.error({ err }, "Weekly summary failed");
  }
}

function scheduleWeeklySummary() {
  const now = new Date();
  // Next Sunday 23:30 UTC
  const next = new Date(now);
  const dayOfWeek = now.getUTCDay(); // 0=Sun
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  next.setUTCDate(now.getUTCDate() + daysUntilSunday);
  next.setUTCHours(23, 30, 0, 0);
  const delay = next.getTime() - Date.now();
  logger.info({ nextRun: next.toISOString() }, "Weekly summary scheduled");
  setTimeout(async () => {
    await runWeeklySummary();
    scheduleWeeklySummary();
  }, delay);
}

scheduleWeeklySummary();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
