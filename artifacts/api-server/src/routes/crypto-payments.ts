import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, cryptoPaymentsTable, listingsTable, sponsoredAdsTable } from "@workspace/db";

const router: IRouter = Router();

const WALLETS: Record<string, string> = {
  USDT_TRC20: "TEoXrL4bSj7adM6CbdYowTrdDp6RNuuXZL",
  SOL: "J7ptr4kryRKb51cSqE66C6qBeUYxHZwmU9q7xCKubCW2",
};

const NETWORK_LABELS: Record<string, string> = {
  USDT_TRC20: "USDT (TRC-20 / Tron)",
  SOL: "SOL (Solana)",
};

async function getEurToCrypto(eurAmount: number, currency: string): Promise<string> {
  try {
    if (currency === "USDT_TRC20") {
      const rate = 1.08;
      return (eurAmount * rate).toFixed(2);
    }
    if (currency === "SOL") {
      const resp = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur",
        { signal: AbortSignal.timeout(4000) }
      );
      if (resp.ok) {
        const data = await resp.json() as { solana?: { eur?: number } };
        const solEur = data?.solana?.eur;
        if (solEur && solEur > 0) {
          return (eurAmount / solEur).toFixed(4);
        }
      }
      return (eurAmount / 130).toFixed(4);
    }
  } catch {
    if (currency === "USDT_TRC20") return (eurAmount * 1.08).toFixed(2);
    if (currency === "SOL") return (eurAmount / 130).toFixed(4);
  }
  return eurAmount.toFixed(2);
}

router.post("/crypto-payments", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Nicht eingeloggt." });
    return;
  }

  const { currency, purpose, listingId, purposeRefId, eurAmount } = req.body as {
    currency?: string;
    purpose?: string;
    listingId?: number;
    purposeRefId?: string;
    eurAmount?: number;
  };

  if (!currency || !WALLETS[currency]) {
    res.status(400).json({ error: "Ungültige Kryptowährung. Erlaubt: USDT_TRC20, SOL" });
    return;
  }

  if (!purpose || !["listing_fee", "boost", "sponsored_ad"].includes(purpose)) {
    res.status(400).json({ error: "Ungültiger Zweck." });
    return;
  }

  if (!eurAmount || eurAmount <= 0) {
    res.status(400).json({ error: "Ungültiger Betrag." });
    return;
  }

  const walletAddress = WALLETS[currency];
  const expectedAmountCrypto = await getEurToCrypto(eurAmount, currency);

  const [payment] = await db
    .insert(cryptoPaymentsTable)
    .values({
      userId: String(req.user!.id),
      listingId: listingId ?? null,
      purpose,
      purposeRefId: purposeRefId ?? null,
      currency,
      expectedAmountCrypto,
      eurAmount: String(eurAmount),
      walletAddress,
      status: "awaiting_payment",
    })
    .returning();

  res.status(201).json({
    id: payment.id,
    walletAddress,
    expectedAmountCrypto,
    currency,
    networkLabel: NETWORK_LABELS[currency],
    eurAmount,
    status: payment.status,
    createdAt: payment.createdAt,
  });
});

router.patch("/crypto-payments/:id/submit", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Nicht eingeloggt." });
    return;
  }

  const id = Number(req.params.id);
  const { txHash } = req.body as { txHash?: string };

  if (!txHash || txHash.trim().length < 10) {
    res.status(400).json({ error: "Ungültiger Transaction-Hash." });
    return;
  }

  const [existing] = await db
    .select()
    .from(cryptoPaymentsTable)
    .where(and(eq(cryptoPaymentsTable.id, id), eq(cryptoPaymentsTable.userId, String(req.user!.id))));

  if (!existing) {
    res.status(404).json({ error: "Zahlung nicht gefunden." });
    return;
  }

  if (existing.status !== "awaiting_payment") {
    res.status(400).json({ error: "Zahlung wurde bereits eingereicht oder bestätigt." });
    return;
  }

  const [updated] = await db
    .update(cryptoPaymentsTable)
    .set({ txHash: txHash.trim(), status: "pending_review" })
    .where(eq(cryptoPaymentsTable.id, id))
    .returning();

  res.json({ id: updated.id, status: updated.status, txHash: updated.txHash });
});

router.get("/crypto-payments/my", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Nicht eingeloggt." });
    return;
  }

  const payments = await db
    .select()
    .from(cryptoPaymentsTable)
    .where(eq(cryptoPaymentsTable.userId, String(req.user!.id)))
    .orderBy(desc(cryptoPaymentsTable.createdAt));

  res.json(
    payments.map((p) => ({
      id: p.id,
      purpose: p.purpose,
      listingId: p.listingId,
      currency: p.currency,
      networkLabel: NETWORK_LABELS[p.currency] ?? p.currency,
      expectedAmountCrypto: p.expectedAmountCrypto,
      eurAmount: Number(p.eurAmount),
      walletAddress: p.walletAddress,
      txHash: p.txHash,
      status: p.status,
      adminNote: p.adminNote,
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.get("/admin/crypto-payments", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payments = await db
    .select()
    .from(cryptoPaymentsTable)
    .orderBy(desc(cryptoPaymentsTable.createdAt));

  res.json(
    payments.map((p) => ({
      id: p.id,
      userId: p.userId,
      purpose: p.purpose,
      listingId: p.listingId,
      purposeRefId: p.purposeRefId,
      currency: p.currency,
      networkLabel: NETWORK_LABELS[p.currency] ?? p.currency,
      expectedAmountCrypto: p.expectedAmountCrypto,
      eurAmount: Number(p.eurAmount),
      walletAddress: p.walletAddress,
      txHash: p.txHash,
      status: p.status,
      adminNote: p.adminNote,
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.patch("/admin/crypto-payments/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  const { action, adminNote } = req.body as {
    action?: "confirm" | "reject";
    adminNote?: string;
  };

  if (!action || !["confirm", "reject"].includes(action)) {
    res.status(400).json({ error: "action muss 'confirm' oder 'reject' sein." });
    return;
  }

  const [existing] = await db
    .select()
    .from(cryptoPaymentsTable)
    .where(eq(cryptoPaymentsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Zahlung nicht gefunden." });
    return;
  }

  const newStatus = action === "confirm" ? "confirmed" : "rejected";

  const [updated] = await db
    .update(cryptoPaymentsTable)
    .set({
      status: newStatus,
      adminNote: adminNote?.trim() ?? null,
      confirmedAt: action === "confirm" ? new Date() : null,
    })
    .where(eq(cryptoPaymentsTable.id, id))
    .returning();

  if (action === "confirm") {
    if (existing.purpose === "listing_fee" && existing.listingId) {
      await db
        .update(listingsTable)
        .set({ paymentStatus: "paid", listingType: "paid", paidAt: new Date() })
        .where(eq(listingsTable.id, existing.listingId))
        .catch(() => {});
    }

    if (existing.purpose === "sponsored_ad" && existing.purposeRefId) {
      const adId = Number(existing.purposeRefId);
      if (!isNaN(adId)) {
        await db
          .update(sponsoredAdsTable)
          .set({ paymentStatus: "paid" })
          .where(eq(sponsoredAdsTable.id, adId))
          .catch(() => {});
      }
    }
  }

  res.json({ id: updated.id, status: updated.status, adminNote: updated.adminNote });
});

export default router;
