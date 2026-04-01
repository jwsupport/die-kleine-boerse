import app from "./app";
import { logger } from "./lib/logger";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
