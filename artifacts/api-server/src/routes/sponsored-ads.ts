import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, sponsoredAdsTable, profilesTable } from "@workspace/db";
import { getUncachableStripeClient } from "../stripeClient";

const router: IRouter = Router();

const AD_PRICE_CENTS = 4900; // €49.00

router.post("/sponsored-ads", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Nicht eingeloggt" });
    return;
  }

  const userId = (req.user as any).id as string;
  const { title, description, imageUrl, targetUrl } = req.body;

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
          unit_amount: AD_PRICE_CENTS,
          product_data: {
            name: "Werbeplatz — Die kleine Börse",
            description: `Ihre Werbeanzeige wird nach Admin-Prüfung auf der Startseite angezeigt.`,
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
    createdAt: ad.createdAt.toISOString(),
  })));
});

router.get("/sponsored-ads/active", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      ad: sponsoredAdsTable,
      profile: profilesTable,
    })
    .from(sponsoredAdsTable)
    .leftJoin(profilesTable, eq(sponsoredAdsTable.profileId, profilesTable.id))
    .where(eq(sponsoredAdsTable.status, "approved"))
    .orderBy(desc(sponsoredAdsTable.createdAt))
    .limit(6);

  res.json(rows.map(({ ad, profile }) => ({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    imageUrl: ad.imageUrl,
    targetUrl: ad.targetUrl,
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
