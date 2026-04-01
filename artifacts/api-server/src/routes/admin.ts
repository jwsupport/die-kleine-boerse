import { Router, type IRouter } from "express";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { db, listingsTable, profilesTable } from "@workspace/db";
import {
  AdminGetListingsQueryParams,
  AdminGetListingsResponse,
  AdminUpdateListingStatusParams,
  AdminUpdateListingStatusBody,
  AdminUpdateListingStatusResponse,
  AdminGetStatsQueryParams,
  AdminGetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/listings", async (req, res): Promise<void> => {
  const query = AdminGetListingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, isReported, limit, offset } = query.data;

  const conditions = [];
  if (status) conditions.push(eq(listingsTable.status, status));
  if (isReported != null) conditions.push(eq(listingsTable.isReported, isReported));

  const rows = await db
    .select({
      listing: listingsTable,
      seller: profilesTable,
    })
    .from(listingsTable)
    .leftJoin(profilesTable, eq(listingsTable.sellerId, profilesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${listingsTable.createdAt} desc`)
    .limit(limit ?? 100)
    .offset(offset ?? 0);

  res.json(
    AdminGetListingsResponse.parse(
      rows.map(({ listing, seller }) => ({
        id: listing.id,
        sellerId: listing.sellerId,
        sellerName: seller?.fullName ?? seller?.username ?? null,
        title: listing.title,
        description: listing.description,
        price: Number(listing.price),
        isNegotiable: listing.isNegotiable,
        category: listing.category,
        location: listing.location,
        imageUrls: listing.imageUrls,
        status: listing.status,
        listingType: listing.listingType,
        isReported: listing.isReported,
        reportReason: listing.reportReason,
        expiryDate: listing.expiryDate ? listing.expiryDate.toISOString() : null,
        paidAt: listing.paidAt ? listing.paidAt.toISOString() : null,
        daysAge: Math.floor((Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        createdAt: listing.createdAt.toISOString(),
      })),
    ),
  );
});

router.patch("/admin/listings/:id/status", async (req, res): Promise<void> => {
  const params = AdminUpdateListingStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateListingStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {
    status: parsed.data.status,
  };

  // Clear report flag when approving/keeping
  if (parsed.data.status === "active") {
    updates.isReported = false;
    updates.reportReason = null;
  }

  const [listing] = await db
    .update(listingsTable)
    .set(updates)
    .where(eq(listingsTable.id, params.data.id))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const [seller] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, listing.sellerId));

  res.json(
    AdminUpdateListingStatusResponse.parse({
      id: listing.id,
      sellerId: listing.sellerId,
      sellerName: seller?.fullName ?? seller?.username ?? null,
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      isNegotiable: listing.isNegotiable,
      category: listing.category,
      location: listing.location,
      imageUrls: listing.imageUrls,
      status: listing.status,
      listingType: listing.listingType,
      isReported: listing.isReported,
      reportReason: listing.reportReason,
      expiryDate: listing.expiryDate ? listing.expiryDate.toISOString() : null,
      paidAt: listing.paidAt ? listing.paidAt.toISOString() : null,
      daysAge: Math.floor((Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      createdAt: listing.createdAt.toISOString(),
    }),
  );
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  const query = AdminGetStatsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { month, year } = query.data;
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  const periodStart = new Date(targetYear, targetMonth - 1, 1);
  const periodEnd = new Date(targetYear, targetMonth, 1);

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where status = 'active')::int`,
      deleted: sql<number>`count(*) filter (where status = 'deleted')::int`,
      reported: sql<number>`count(*) filter (where is_reported = true)::int`,
      pending: sql<number>`count(*) filter (where status = 'pending')::int`,
      free: sql<number>`count(*) filter (where listing_type = 'free')::int`,
      paid: sql<number>`count(*) filter (where listing_type = 'paid')::int`,
    })
    .from(listingsTable);

  const [profileTotals] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(profilesTable);

  const [periodListings] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(listingsTable)
    .where(
      and(
        gte(listingsTable.createdAt, periodStart),
        lt(listingsTable.createdAt, periodEnd),
      ),
    );

  const [periodProfiles] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(profilesTable)
    .where(
      and(
        gte(profilesTable.createdAt, periodStart),
        lt(profilesTable.createdAt, periodEnd),
      ),
    );

  res.json(
    AdminGetStatsResponse.parse({
      totalListings: totals?.total ?? 0,
      activeListings: totals?.active ?? 0,
      deletedListings: totals?.deleted ?? 0,
      reportedListings: totals?.reported ?? 0,
      pendingListings: totals?.pending ?? 0,
      freeListings: totals?.free ?? 0,
      paidListings: totals?.paid ?? 0,
      totalProfiles: profileTotals?.total ?? 0,
      newProfilesThisPeriod: periodProfiles?.count ?? 0,
      newListingsThisPeriod: periodListings?.count ?? 0,
    }),
  );
});

export default router;
