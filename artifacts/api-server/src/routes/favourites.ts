import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, favouritesTable, listingsTable } from "@workspace/db";
import type { Listing } from "@workspace/db";

const router: IRouter = Router();

function mapListing(l: Listing) {
  return {
    id: l.id,
    sellerId: l.sellerId,
    title: l.title,
    description: l.description ?? null,
    price: parseFloat(l.price as string),
    isNegotiable: l.isNegotiable,
    category: l.category,
    location: l.location,
    imageUrls: l.imageUrls ?? [],
    status: l.status,
    listingType: l.listingType,
    isReported: l.isReported,
    lat: l.lat != null ? parseFloat(l.lat as string) : null,
    lng: l.lng != null ? parseFloat(l.lng as string) : null,
    expiryDate: l.expiryDate?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    daysAge: Math.floor((Date.now() - l.createdAt.getTime()) / 86_400_000),
  };
}

router.get("/favourites", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select({ listing: listingsTable })
    .from(favouritesTable)
    .innerJoin(listingsTable, eq(favouritesTable.listingId, listingsTable.id))
    .where(eq(favouritesTable.userId, req.user.id))
    .orderBy(favouritesTable.createdAt);

  res.json(rows.map((r) => mapListing(r.listing)));
});

router.get("/favourites/ids", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.json([]);
    return;
  }

  const rows = await db
    .select({ listingId: favouritesTable.listingId })
    .from(favouritesTable)
    .where(eq(favouritesTable.userId, req.user.id));

  res.json(rows.map((r) => r.listingId));
});

router.post("/favourites", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { listingId } = req.body;
  if (!listingId || typeof listingId !== "string") {
    res.status(400).json({ error: "listingId required" });
    return;
  }

  await db
    .insert(favouritesTable)
    .values({ userId: req.user.id, listingId })
    .onConflictDoNothing();

  res.sendStatus(204);
});

router.delete("/favourites/:listingId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { listingId } = req.params;

  await db
    .delete(favouritesTable)
    .where(
      and(
        eq(favouritesTable.userId, req.user.id),
        eq(favouritesTable.listingId, listingId),
      ),
    );

  res.sendStatus(204);
});

export default router;
