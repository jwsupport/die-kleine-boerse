import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, sponsoredAdsTable, profilesTable } from "@workspace/db";
import { getUncachableStripeClient } from "../stripeClient";

const router: IRouter = Router();

const AD_PRICE_CENTS = 4900;       // €49.00 regular
const PREMIUM_PRICE_CENTS = 7900;  // €79.00 premium (6th slot, always top)

function getWeekMonday(d: Date): string {
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return monday.toISOString().split("T")[0]!;
}

function addWeeks(monday: string, weeks: number): string {
  const d = new Date(monday);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().split("T")[0]!;
}

router.post("/sponsored-ads", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Nicht eingeloggt" });
    return;
  }

  const userId = (req.user as any).id as string;
  const { title, description, imageUrl, targetUrl, isPremium } = req.body;

  if (!title?.trim() || !targetUrl?.trim()) {
    res.status(400).json({ error: "Titel und Ziel-URL sind erforderlich" });
    return;
  }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, userId));

  if (!profile || !(profile as any).isBusiness) {
    res.status(403).json({ error: "Nur für Gewerbekunden" });
    return;
  }

  const premium = !!isPremium;
  const priceCents = premium ? PREMIUM_PRICE_CENTS : AD_PRICE_CENTS;

  const [ad] = await db
    .insert(sponsoredAdsTable)
    .values({
      profileId: userId,
      title: title.trim(),
      description: description?.trim() ?? null,
      imageUrl: imageUrl?.trim() ?? null,
      targetUrl: targetUrl.trim(),
      status: "pending",
      paymentStatus: "pending",
      isPremium: premium,
    })
    .returning();

  const stripe = await getUncachableStripeClient();
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || req.headers.host;
  const baseUrl = `https://${domain}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: priceCents,
          product_data: {
            name: premium
              ? "Werbeplatz PREMIUM — Die kleine Börse"
              : "Werbeplatz — Die kleine Börse",
            description: premium
              ? "Ihr Banner erscheint diese Woche ganz oben (Slot #1, Premium)."
              : "Ihr Banner erscheint in der nächsten verfügbaren Woche (Slot 1–5).",
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/ads/create?payment=success&adId=${ad.id}`,
    cancel_url: `${baseUrl}/ads/create?payment=cancelled`,
    metadata: { adId: ad.id, type: "sponsored_ad" },
  });

  await db
    .update(sponsoredAdsTable)
    .set({ stripeSessionId: session.id })
    .where(eq(sponsoredAdsTable.id, ad.id));

  res.json({ checkoutUrl: session.url, adId: ad.id });
});

router.get("/sponsored-ads/my", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Nicht eingeloggt" });
    return;
  }

  const userId = (req.user as any).id as string;

  const rows = await db
    .select()
    .from(sponsoredAdsTable)
    .where(eq(sponsoredAdsTable.profileId, userId))
    .orderBy(desc(sponsoredAdsTable.createdAt));

  res.json(rows.map((ad) => ({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    imageUrl: ad.imageUrl,
    targetUrl: ad.targetUrl,
    status: ad.status,
    paymentStatus: ad.paymentStatus,
    adminNote: ad.adminNote,
    isPremium: ad.isPremium,
    weekStart: ad.weekStart ?? null,
    slotPosition: ad.slotPosition ?? null,
    createdAt: ad.createdAt.toISOString(),
  })));
});

router.get("/sponsored-ads/active", async (_req, res): Promise<void> => {
  const currentMonday = getWeekMonday(new Date());

  const premiumRows = await db
    .select({ ad: sponsoredAdsTable, profile: profilesTable })
    .from(sponsoredAdsTable)
    .leftJoin(profilesTable, eq(sponsoredAdsTable.profileId, profilesTable.id))
    .where(
      and(
        eq(sponsoredAdsTable.status, "approved"),
        eq(sponsoredAdsTable.isPremium, true),
        eq(sponsoredAdsTable.weekStart, currentMonday),
      ),
    )
    .orderBy(desc(sponsoredAdsTable.createdAt))
    .limit(1);

  const regularRows = await db
    .select({ ad: sponsoredAdsTable, profile: profilesTable })
    .from(sponsoredAdsTable)
    .leftJoin(profilesTable, eq(sponsoredAdsTable.profileId, profilesTable.id))
    .where(
      and(
        eq(sponsoredAdsTable.status, "approved"),
        eq(sponsoredAdsTable.isPremium, false),
        eq(sponsoredAdsTable.weekStart, currentMonday),
      ),
    )
    .orderBy(sponsoredAdsTable.slotPosition)
    .limit(5);

  const all = [...premiumRows, ...regularRows];

  res.json(all.map(({ ad, profile }) => ({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    imageUrl: ad.imageUrl,
    targetUrl: ad.targetUrl,
    isPremium: ad.isPremium,
    slotPosition: ad.slotPosition,
    companyName: (profile as any)?.companyName ?? profile?.fullName ?? null,
  })));
});

router.get("/sponsored-ads/:id/stripe-status", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Nicht eingeloggt" });
    return;
  }

  const { id } = req.params;
  const userId = (req.user as any).id as string;

  const [ad] = await db
    .select()
    .from(sponsoredAdsTable)
    .where(eq(sponsoredAdsTable.id, id));

  if (!ad || ad.profileId !== userId) {
    res.status(404).json({ error: "Nicht gefunden" });
    return;
  }

  if (ad.paymentStatus === "paid") {
    res.json({ status: "paid" });
    return;
  }

  if (!ad.stripeSessionId) {
    res.json({ status: "pending" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(ad.stripeSessionId);

    if (session.payment_status === "paid") {
      await db
        .update(sponsoredAdsTable)
        .set({ paymentStatus: "paid" })
        .where(eq(sponsoredAdsTable.id, id));

      res.json({ status: "paid" });
    } else {
      res.json({ status: "pending" });
    }
  } catch {
    res.json({ status: "pending" });
  }
});

export default router;
