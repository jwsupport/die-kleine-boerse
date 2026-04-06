import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const visitorSessionsTable = pgTable("visitor_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull().unique(),
  ip: text("ip"),
  country: text("country"),
  countryCode: text("country_code"),
  city: text("city"),
  path: text("path").notNull().default("/"),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type VisitorSession = typeof visitorSessionsTable.$inferSelect;
export type NewVisitorSession = typeof visitorSessionsTable.$inferInsert;
