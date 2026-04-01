import { Router, type IRouter } from "express";
import { db, listingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient, getStripeSync } from "../stripeClient";

const router: IRouter = Router();

router.post("/stripe/checkout", async (req, res): Promise<void> => {
  const { listingId } = req.body;
  if (!listingId) {
    res.status(400).json({ error: "listingId is required" });
    return;
  }

  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, listingId));

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const stripe = await getUncachableStripeClient();

  const domain =
    process.env.REPLIT_DOMAINS?.split(",")[0] || req.headers.host;
  const baseUrl = `https://${domain}`;

  const priceRows = await db.execute(sql`
    SELECT pr.id as price_id
    FROM stripe.products p
    JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
    WHERE p.name = 'Premium Listing' AND p.active = true
    LIMIT 1
  `);

  const priceId = (priceRows.rows[0] as { price_id: string } | undefined)
    ?.price_id;

  if (!priceId) {
    res.status(500).json({ error: "Premium listing price not configured" });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    success_url: `${baseUrl}/listings/${listingId}?payment=success`,
    cancel_url: `${baseUrl}/listings/create?payment=cancelled`,
    metadata: { listingId },
  });

  await db
    .update(listingsTable)
    .set({ stripeSessionId: session.id })
    .where(eq(listingsTable.id, listingId));

  res.json({ url: session.url });
});

router.post("/stripe/checkout-category", async (req, res): Promise<void> => {
  const { listingId } = req.body;
  if (!listingId) {
    res.status(400).json({ error: "listingId is required" });
    return;
  }

  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, listingId));

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const fee = Number(listing.listingFee);
  if (fee <= 0) {
    res.status(400).json({ error: "This listing has no fee" });
    return;
  }

  const stripe = await getUncachableStripeClient();
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || req.headers.host;
  const baseUrl = `https://${domain}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(fee * 100),
          product_data: {
            name: `Listing Fee — ${listing.category}`,
            description: `One-time fee to publish your listing in ${listing.category}`,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/listings/${listingId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/listings/${listingId}?payment=cancelled`,
    metadata: { listingId, type: "category_fee" },
  });

  await db
    .update(listingsTable)
    .set({ stripeSessionId: session.id })
    .where(eq(listingsTable.id, listingId));

  res.json({ url: session.url });
});

router.get("/stripe/session-status/:listingId", async (req, res): Promise<void> => {
  const { listingId } = req.params;

  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, listingId));

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  if (listing.paymentStatus === "completed") {
    res.json({ status: "completed", listing: { id: listing.id, status: listing.status } });
    return;
  }

  if (!listing.stripeSessionId) {
    res.json({ status: listing.paymentStatus });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(listing.stripeSessionId);

    if (session.payment_status === "paid") {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      await db
        .update(listingsTable)
        .set({
          status: "active",
          paymentStatus: "completed",
          paidAt: new Date(),
          expiryDate,
        })
        .where(eq(listingsTable.id, listingId));

      res.json({ status: "completed", listing: { id: listing.id, status: "active" } });
    } else {
      res.json({ status: "pending" });
    }
  } catch {
    res.json({ status: listing.paymentStatus });
  }
});

router.post("/stripe/webhook-listing", async (req, res): Promise<void> => {
  const { listingId } = req.body;
  if (!listingId) {
    res.status(400).json({ error: "listingId required" });
    return;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  await db
    .update(listingsTable)
    .set({
      listingType: "paid",
      status: "active",
      paidAt: new Date(),
      expiryDate,
    })
    .where(eq(listingsTable.id, listingId));

  res.json({ ok: true });
});

router.get("/stripe/listing-price", async (_req, res): Promise<void> => {
  try {
    const priceRows = await db.execute(sql`
      SELECT pr.id as price_id, pr.unit_amount, pr.currency
      FROM stripe.products p
      JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.name = 'Premium Listing' AND p.active = true
      LIMIT 1
    `);
    const price = priceRows.rows[0] as
      | { price_id: string; unit_amount: number; currency: string }
      | undefined;
    res.json({
      priceId: price?.price_id ?? null,
      amount: price?.unit_amount ?? 100,
      currency: price?.currency ?? "eur",
    });
  } catch {
    res.json({ priceId: null, amount: 100, currency: "eur" });
  }
});

export default router;
