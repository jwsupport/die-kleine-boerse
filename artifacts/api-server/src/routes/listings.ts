import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, sql, count } from "drizzle-orm";
import { notifyNewListing } from "../lib/adminEmail";
import { db, listingsTable, profilesTable, searchStatsTable, businessBookingsTable } from "@workspace/db";
import type { Listing } from "@workspace/db";
import {
  GetListingsQueryParams,
  GetListingsResponse,
  CreateListingBody,
  GetListingParams,
  GetListingResponse,
  UpdateListingParams,
  UpdateListingBody,
  UpdateListingResponse,
  DeleteListingParams,
  ReportListingParams,
  ReportListingBody,
  ReportListingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const CATEGORY_FEES: Record<string, number> = {
  "Vehicles & Mobility": 5.49,
  "Real Estate": 9.49,
};

function mapListing(l: Listing) {
  const now = Date.now();
  const createdMs = l.createdAt instanceof Date ? l.createdAt.getTime() : new Date(l.createdAt).getTime();
  const daysAge = Math.floor((now - createdMs) / (1000 * 60 * 60 * 24));
  return {
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
    expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString() : null,
    paidAt: l.paidAt ? new Date(l.paidAt).toISOString() : null,
    paymentStatus: l.paymentStatus,
    listingFee: Number(l.listingFee),
    daysAge,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : new Date(l.createdAt).toISOString(),
  };
}

router.get("/listings", async (req, res): Promise<void> => {
  const query = GetListingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, location, search, minPrice, maxPrice, limit, offset } = query.data;

  const conditions = [];
  // Only show active listings on the public feed; never show silent ones
  conditions.push(eq(listingsTable.status, "active"));
  conditions.push(eq(listingsTable.isSilent, false));
  if (category) conditions.push(eq(listingsTable.category, category));
  if (location) conditions.push(ilike(listingsTable.location, `%${location}%`));
  if (search) {
    conditions.push(
      sql`(${listingsTable.title} ilike ${"%" + search + "%"} or ${listingsTable.description} ilike ${"%" + search + "%"})`,
    );
  }
  if (minPrice != null) conditions.push(gte(listingsTable.price, String(minPrice)));
  if (maxPrice != null) conditions.push(lte(listingsTable.price, String(maxPrice)));

  const rows = await db
    .select({ listing: listingsTable, seller: profilesTable })
    .from(listingsTable)
    .leftJoin(profilesTable, eq(listingsTable.sellerId, profilesTable.id))
    .where(and(...conditions))
    .orderBy(sql`${listingsTable.createdAt} desc`)
    .limit(limit ?? 50)
    .offset(offset ?? 0);

  if (search && search.trim().length >= 2) {
    const kw = search.trim().toLowerCase();
    const matchCount = await db
      .select({ c: count() })
      .from(listingsTable)
      .where(
        and(
          eq(listingsTable.status, "active"),
          sql`${listingsTable.title} ilike ${"%" + kw + "%"}`,
        ),
      );
    const lcount = Number(matchCount[0]?.c ?? 0);
    db.insert(searchStatsTable)
      .values({ keyword: kw, searchCount: 1, listingCount: lcount, lastSearchedAt: new Date() })
      .onConflictDoUpdate({
        target: searchStatsTable.keyword,
        set: {
          searchCount: sql`${searchStatsTable.searchCount} + 1`,
          listingCount: lcount,
          lastSearchedAt: new Date(),
        },
      })
      .catch(() => {});
  }

  res.json(rows.map(({ listing, seller }) => ({
    ...mapListing(listing),
    sellerIsVerified: seller?.isVerified ?? false,
    sellerIsBusiness: seller?.isBusiness ?? false,
    sellerUsername: seller?.username ?? null,
  })));
});

router.post("/listings", async (req, res): Promise<void> => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sellerId, title, description, price, isNegotiable, category, location, imageUrls, listingType, lat, lng, boostTier, videoUrl, isSilent } =
    parsed.data as any;

  const [existingProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, sellerId));

  if (!existingProfile) {
    await db.insert(profilesTable).values({ id: sellerId });
  }

  // Enforce image limit — business sellers get 8, everyone else 4
  const maxImages = existingProfile?.isBusiness ? 8 : 4;
  if (imageUrls && imageUrls.length > maxImages) {
    res.status(400).json({ error: `Maximum von ${maxImages} Bildern pro Inserat.` });
    return;
  }

  // Enforce 200 active listings per user
  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(listingsTable)
    .where(and(eq(listingsTable.sellerId, sellerId), eq(listingsTable.status, "active")));

  if (Number(activeCount) >= 200) {
    res.status(400).json({ error: "Maximum limit of 200 active listings reached." });
    return;
  }

  const categoryFee = CATEGORY_FEES[category] ?? 0;
  const isBoost = boostTier === "boost";
  const fee = isBoost && categoryFee === 0 ? 1.00 : categoryFee;
  const requiresPayment = fee > 0;
  const type = (listingType as string) ?? "free";
  const durationMs = (isBoost || requiresPayment) ? 30 * 24 * 60 * 60 * 1000 : 10 * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(Date.now() + durationMs);

  // Video-Proof: listings ≥ €500 with a video URL go into pending_video until admin approves
  const priceNum = Number(price);
  const needsVideoProof = priceNum >= 500 && !!videoUrl;
  let status: string;
  if (needsVideoProof) {
    status = "pending_video";
  } else if (requiresPayment) {
    status = "pending";
  } else {
    status = "active";
  }

  const [listing] = await db
    .insert(listingsTable)
    .values({
      sellerId,
      title,
      description: description ?? null,
      price: String(price),
      isNegotiable: isNegotiable ?? false,
      category,
      location,
      imageUrls: imageUrls ?? [],
      listingType: type,
      lat: lat != null ? String(lat) : null,
      lng: lng != null ? String(lng) : null,
      expiryDate,
      status,
      paymentStatus: requiresPayment ? "pending" : "not_required",
      listingFee: String(fee),
      videoUrl: videoUrl ?? null,
      isSilent: isSilent ?? false,
    } as any)
    .returning();

  // Notify admin of new listing (fire-and-forget)
  notifyNewListing({
    id: listing.id,
    title: listing.title,
    price: Number(listing.price),
    category: listing.category,
    location: listing.location ?? null,
    sellerId: listing.sellerId,
  }).catch(() => {});

  // Auto-create a business_booking record if seller is a business and paid
  if (fee > 0) {
    const [profile] = await db
      .select({ isBusiness: (profilesTable as any).isBusiness })
      .from(profilesTable)
      .where(eq(profilesTable.id, sellerId));
    if ((profile as any)?.isBusiness) {
      db.insert(businessBookingsTable as any)
        .values({
          profileId: sellerId,
          listingId: listing.id,
          amount: String(fee),
          paymentStatus: "pending",
        })
        .catch(() => {});
    }
  }

  res.status(201).json(mapListing(listing));
});

router.get("/listings/archive", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 24, 100);
  const offset = Number(req.query.offset) || 0;

  const rows = await db
    .select({
      listing: listingsTable,
      seller: profilesTable,
    })
    .from(listingsTable)
    .leftJoin(profilesTable, eq(listingsTable.sellerId, profilesTable.id))
    .where(eq(listingsTable.status, "sold"))
    .orderBy(sql`${listingsTable.createdAt} desc`)
    .limit(limit)
    .offset(offset);

  res.json(rows.map(({ listing, seller }) => ({
    id: listing.id,
    title: listing.title,
    price: Number(listing.price),
    category: listing.category,
    location: listing.location,
    imageUrls: listing.imageUrls,
    createdAt: listing.createdAt.toISOString(),
    sellerName: seller?.fullName ?? seller?.username ?? null,
  })));
});

router.get("/listings/:id", async (req, res): Promise<void> => {
  const params = GetListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      listing: listingsTable,
      seller: profilesTable,
    })
    .from(listingsTable)
    .leftJoin(profilesTable, eq(listingsTable.sellerId, profilesTable.id))
    .where(eq(listingsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const { listing, seller } = row;

  res.json({
    ...mapListing(listing),
    seller: {
      id: seller?.id ?? listing.sellerId,
      username: seller?.username ?? null,
      fullName: seller?.fullName ?? null,
      avatarUrl: seller?.avatarUrl ?? null,
      createdAt: seller?.createdAt?.toISOString() ?? new Date().toISOString(),
      isVerified: seller?.isVerified ?? false,
      isBusiness: seller?.isBusiness ?? false,
      companyName: seller?.companyName ?? null,
      vatId: seller?.vatId ?? null,
      street: seller?.street ?? null,
      postalCode: seller?.postalCode ?? null,
      city: seller?.city ?? null,
      country: seller?.country ?? null,
      phone: seller?.phone ?? null,
      website: seller?.website ?? null,
    },
  });
});

router.patch("/listings/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select({ sellerId: listingsTable.sellerId })
    .from(listingsTable)
    .where(eq(listingsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  if (existing.sellerId !== req.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title != null) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.price != null) updates.price = String(parsed.data.price);
  if (parsed.data.isNegotiable != null) updates.isNegotiable = parsed.data.isNegotiable;
  if (parsed.data.category != null) updates.category = parsed.data.category;
  if (parsed.data.location != null) updates.location = parsed.data.location;
  if (parsed.data.imageUrls != null) updates.imageUrls = parsed.data.imageUrls;
  if (parsed.data.lat !== undefined) updates.lat = parsed.data.lat != null ? String(parsed.data.lat) : null;
  if (parsed.data.lng !== undefined) updates.lng = parsed.data.lng != null ? String(parsed.data.lng) : null;

  const [listing] = await db
    .update(listingsTable)
    .set(updates)
    .where(eq(listingsTable.id, params.data.id))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.json(UpdateListingResponse.parse(mapListing(listing)));
});

router.delete("/listings/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select({ sellerId: listingsTable.sellerId })
    .from(listingsTable)
    .where(eq(listingsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  if (existing.sellerId !== req.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [listing] = await db
    .update(listingsTable)
    .set({ status: "deleted" })
    .where(eq(listingsTable.id, params.data.id))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/listings/:id/report", async (req, res): Promise<void> => {
  const params = ReportListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ReportListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [listing] = await db
    .update(listingsTable)
    .set({ isReported: true, reportReason: parsed.data.reason })
    .where(eq(listingsTable.id, params.data.id))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.json(ReportListingResponse.parse(mapListing(listing)));
});

export default router;
