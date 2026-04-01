import { pgTable, text, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";
import { listingsTable } from "./listings";

export const favouritesTable = pgTable("favourites", {
  userId: text("user_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.listingId] }),
]);

export type Favourite = typeof favouritesTable.$inferSelect;
