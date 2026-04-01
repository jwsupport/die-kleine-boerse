import { pgTable, text, boolean, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const listingsTable = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: text("seller_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  isNegotiable: boolean("is_negotiable").notNull().default(false),
  category: text("category").notNull(),
  location: text("location").notNull(),
  imageUrls: text("image_urls").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
