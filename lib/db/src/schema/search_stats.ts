import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const searchStatsTable = pgTable("search_stats", {
  keyword: text("keyword").primaryKey(),
  searchCount: integer("search_count").notNull().default(0),
  listingCount: integer("listing_count").notNull().default(0),
  lastSearchedAt: timestamp("last_searched_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SearchStat = typeof searchStatsTable.$inferSelect;
