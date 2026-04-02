import { Router, type IRouter } from "express";
import { eq, and, ne, desc } from "drizzle-orm";
import { db, profilesTable, listingsTable, businessBookingsTable } from "@workspace/db";
import {
  GetProfileParams,
  GetProfileResponse,
  GetProfileListingsParams,
  GetProfileListingsResponse,
  UpdateProfileParams,
  UpdateProfileBody,
  UpdateProfileResponse,
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

  res.json({
    id: profile.id,
    username: profile.username,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt.toISOString(),
    isVerified: profile.isVerified,
    verificationDate: profile.verificationDate?.toISOString() ?? null,
    isBusiness: profile.isBusiness,
    companyName: profile.companyName ?? null,
    vatId: profile.vatId ?? null,
    setupComplete: (profile as any).setupComplete ?? false,
  });
});

router.patch("/profiles/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (req.user.id !== params.data.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { fullName, username } = body.data;
  const { isBusiness, companyName, vatId, setupComplete } = req.body as {
    isBusiness?: boolean; companyName?: string; vatId?: string; setupComplete?: boolean;
  };

  // Check username uniqueness if a new username is being set
  if (username != null && username !== "") {
    const [existing] = await db
      .select({ id: profilesTable.id })
      .from(profilesTable)
      .where(
        and(
          eq(profilesTable.username, username),
          ne(profilesTable.id, params.data.id),
        ),
      );
    if (existing) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
  }

  const updateData: Partial<typeof profilesTable.$inferInsert> = {};
  if (fullName !== undefined) updateData.fullName = fullName ?? null;
  if (username !== undefined) updateData.username = username ?? null;
  if (isBusiness !== undefined) (updateData as any).isBusiness = isBusiness;
  if (companyName !== undefined) (updateData as any).companyName = companyName?.trim() || null;
  if (vatId !== undefined) (updateData as any).vatId = vatId?.trim() || null;
  if (setupComplete !== undefined) (updateData as any).setupComplete = setupComplete;

  const [updated] = await db
    .update(profilesTable)
    .set(updateData)
    .where(eq(profilesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({
    id: updated.id,
    username: updated.username,
    fullName: updated.fullName,
    avatarUrl: updated.avatarUrl,
    createdAt: updated.createdAt.toISOString(),
    isBusiness: (updated as any).isBusiness ?? false,
    companyName: (updated as any).companyName ?? null,
    vatId: (updated as any).vatId ?? null,
    setupComplete: (updated as any).setupComplete ?? false,
  });
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
        expiryDate: l.expiryDate ? l.expiryDate.toISOString() : null,
        paidAt: l.paidAt ? l.paidAt.toISOString() : null,
        daysAge: Math.floor((Date.now() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        createdAt: l.createdAt.toISOString(),
      })),
    ),
  );
});

router.patch("/profiles/:id/verify", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { id } = req.params;
  const { verify } = req.body as { verify: boolean };

  await db
    .update(profilesTable)
    .set({
      isVerified: verify,
      verificationDate: verify ? new Date() : null,
    })
    .where(eq(profilesTable.id, id));

  res.json({ ok: true });
});

router.get("/profiles", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const profiles = await db.select().from(profilesTable).orderBy(profilesTable.createdAt);

  res.json(
    profiles.map((p) => ({
      id: p.id,
      username: p.username,
      fullName: p.fullName,
      avatarUrl: p.avatarUrl,
      createdAt: p.createdAt.toISOString(),
      isVerified: p.isVerified,
      verificationDate: p.verificationDate?.toISOString() ?? null,
    })),
  );
});

export default router;
