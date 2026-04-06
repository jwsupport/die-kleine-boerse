import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, visitorSessionsTable } from "@workspace/db";

// Lazy-load geoip-lite so a missing .dat file doesn't crash the whole server
let geoip: { lookup: (ip: string) => { country?: string; city?: string } | null } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  geoip = require("geoip-lite");
} catch {
  console.warn("[analytics] geoip-lite not available – country lookup disabled");
}

const router: IRouter = Router();

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function getIp(req: any): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return raw.split(",")[0]!.trim();
  }
  return req.ip ?? null;
}

function geoLookup(ip: string | null): { country: string | null; countryCode: string | null; city: string | null } {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("10.") || ip.startsWith("172.") || ip.startsWith("192.168.")) {
    return { country: "Lokal", countryCode: "XX", city: null };
  }
  try {
    const geo = geoip.lookup(ip);
    if (!geo) return { country: null, countryCode: null, city: null };
    return {
      country: geo.country ?? null,
      countryCode: geo.country ?? null,
      city: geo.city ?? null,
    };
  } catch {
    return { country: null, countryCode: null, city: null };
  }
}

// Country code → full name mapping (most relevant)
const COUNTRY_NAMES: Record<string, string> = {
  DE: "Deutschland", AT: "Österreich", CH: "Schweiz", US: "USA", GB: "Großbritannien",
  FR: "Frankreich", IT: "Italien", ES: "Spanien", NL: "Niederlande", PL: "Polen",
  CZ: "Tschechien", SK: "Slowakei", HU: "Ungarn", RO: "Rumänien", TR: "Türkei",
  RU: "Russland", UA: "Ukraine", XX: "Lokal/Dev", CN: "China", JP: "Japan",
  IN: "Indien", BR: "Brasilien", AU: "Australien", CA: "Kanada",
};

function countryName(code: string | null): string {
  if (!code) return "Unbekannt";
  return COUNTRY_NAMES[code] ?? code;
}

// POST /api/analytics/ping
router.post("/analytics/ping", async (req, res): Promise<void> => {
  const { sessionId, path } = req.body as { sessionId?: string; path?: string };
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 80) {
    res.status(400).json({ error: "Invalid sessionId" });
    return;
  }

  const ip = getIp(req);
  const geo = geoLookup(ip);
  const now = new Date();
  const onlineWindow = new Date(now.getTime() - ONLINE_WINDOW_MS);

  await db
    .insert(visitorSessionsTable)
    .values({
      sessionId,
      ip: ip ?? null,
      country: countryName(geo.countryCode),
      countryCode: geo.countryCode,
      city: geo.city,
      path: path ?? "/",
      lastSeen: now,
    })
    .onConflictDoUpdate({
      target: visitorSessionsTable.sessionId,
      set: {
        lastSeen: now,
        path: path ?? "/",
      },
    });

  const { rows } = await db.execute(
    sql`SELECT COUNT(DISTINCT session_id)::int AS cnt
        FROM visitor_sessions
        WHERE last_seen >= ${onlineWindow}`,
  );
  const online = Number((rows[0] as any)?.cnt ?? 0);

  res.json({ ok: true, online });
});

// GET /api/analytics/online  (public)
router.get("/analytics/online", async (_req, res): Promise<void> => {
  const onlineWindow = new Date(Date.now() - ONLINE_WINDOW_MS);
  const { rows } = await db.execute(
    sql`SELECT COUNT(DISTINCT session_id)::int AS cnt
        FROM visitor_sessions
        WHERE last_seen >= ${onlineWindow}`,
  );
  res.json({ online: Number((rows[0] as any)?.cnt ?? 0) });
});

// GET /api/admin/analytics  (admin only)
router.get("/admin/analytics", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const now = new Date();
  const onlineWindow = new Date(now.getTime() - ONLINE_WINDOW_MS);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [{ rows: onlineRows }, { rows: totalRows }, { rows: todayRows }, { rows: weekRows }, { rows: countryRows }] =
    await Promise.all([
      db.execute(
        sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM visitor_sessions WHERE last_seen >= ${onlineWindow}`,
      ),
      db.execute(
        sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM visitor_sessions`,
      ),
      db.execute(
        sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM visitor_sessions WHERE created_at >= ${todayStart}`,
      ),
      db.execute(
        sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM visitor_sessions WHERE created_at >= ${weekStart}`,
      ),
      db.execute(
        sql`SELECT country, COUNT(DISTINCT session_id)::int AS cnt
            FROM visitor_sessions
            WHERE created_at >= ${monthStart} AND country IS NOT NULL
            GROUP BY country
            ORDER BY cnt DESC
            LIMIT 20`,
      ),
    ]);

  res.json({
    online: Number((onlineRows[0] as any)?.cnt ?? 0),
    totalUnique: Number((totalRows[0] as any)?.cnt ?? 0),
    today: Number((todayRows[0] as any)?.cnt ?? 0),
    thisWeek: Number((weekRows[0] as any)?.cnt ?? 0),
    byCountry: countryRows.map((r: any) => ({
      country: r.country,
      count: Number(r.cnt),
    })),
  });
});

export default router;
