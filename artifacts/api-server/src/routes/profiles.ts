import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable, listingsTable } from "@workspace/db";
import {
  GetProfileParams,
  GetProfileResponse,
  GetProfileListingsParams,
  GetProfileListingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profiles/:id", async (req, res): Promise<void> => {
  const params = GetProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, params.data.id));

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(
    GetProfileResponse.parse({
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      createdAt: profile.createdAt.toISOString(),
    }),
  );
});

router.get("/profiles/:id/listings", async (req, res): Promise<void> => {
  const params = GetProfileListingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const listings = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, params.data.id))
    .orderBy(listingsTable.createdAt);

  res.json(
    GetProfileListingsResponse.parse(
      listings.map((l) => ({
        id: l.id,
        sellerId: l.sellerId,
        title: l.title,
        description: l.description,
        price: Number(l.price),
        isNegotiable: l.isNegotiable,
        category: l.category,
        location: l.location,
        imageUrls: l.imageUrls,
        status: l.status,
        listingType: l.listingType,
        isReported: l.isReported,
        reportReason: l.reportReason,
        lat: l.lat != null ? Number(l.lat) : null,
        lng: l.lng != null ? Number(l.lng) : null,
        createdAt: l.createdAt.toISOString(),
      })),
    ),
  );
});

export default router;
