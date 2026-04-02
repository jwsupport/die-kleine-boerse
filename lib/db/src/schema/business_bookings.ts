import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";
import { listingsTable } from "./listings";

export const businessBookingsTable = pgTable("business_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: text("profile_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").references(() => listingsTable.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  paymentStatus: text("payment_status").notNull().default("pending"),
  invoiceNumber: text("invoice_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessBooking = typeof businessBookingsTable.$inferSelect;
