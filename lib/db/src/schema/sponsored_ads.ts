import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const sponsoredAdsTable = pgTable("sponsored_ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: text("profile_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  targetUrl: text("target_url").notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SponsoredAd = typeof sponsoredAdsTable.$inferSelect;
export type NewSponsoredAd = typeof sponsoredAdsTable.$inferInsert;
