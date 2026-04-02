import { pgTable, serial, varchar, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const cryptoPaymentsTable = pgTable("crypto_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  listingId: integer("listing_id"),
  purpose: varchar("purpose", { length: 64 }).notNull(),
  purposeRefId: varchar("purpose_ref_id", { length: 255 }),
  currency: varchar("currency", { length: 32 }).notNull(),
  expectedAmountCrypto: varchar("expected_amount_crypto", { length: 64 }).notNull(),
  eurAmount: numeric("eur_amount", { precision: 10, scale: 2 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  txHash: varchar("tx_hash", { length: 255 }),
  status: varchar("status", { length: 32 }).notNull().default("awaiting_payment"),
  adminNote: varchar("admin_note", { length: 512 }),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});
