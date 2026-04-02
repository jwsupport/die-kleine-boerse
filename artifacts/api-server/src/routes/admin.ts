import { Router, type IRouter } from "express";
import { eq, and, gte, lt, sql, desc } from "drizzle-orm";
import { db, listingsTable, profilesTable, searchStatsTable, businessBookingsTable } from "@workspace/db";
import {
  AdminGetListingsQueryParams,
  AdminGetListingsResponse,
  AdminUpdateListingStatusParams,
  AdminUpdateListingStatusBody,
  AdminUpdateListingStatusResponse,
  AdminGetStatsQueryParams,
  AdminGetStatsResponse,
  AdminGetRevenueQueryParams,
  AdminGetRevenueResponse,
  AdminGetPaymentsQueryParams,
  AdminGetPaymentsResponse,
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
        paymentStatus: listing.paymentStatus,
        listingFee: Number(listing.listingFee),
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

    // If listing has a pending crypto payment, mark it as completed
    const [current] = await db
      .select({ paymentStatus: listingsTable.paymentStatus, listingFee: listingsTable.listingFee })
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.id));

    if (current?.paymentStatus === "pending") {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      updates.paymentStatus = "completed";
      updates.listingType = "paid";
      updates.paidAt = new Date();
      updates.expiryDate = expiryDate;
    }
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
      paymentStatus: listing.paymentStatus,
      listingFee: Number(listing.listingFee),
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

  const periodFilter = and(
    gte(listingsTable.createdAt, periodStart),
    lt(listingsTable.createdAt, periodEnd),
  );

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
    .from(listingsTable)
    .where(periodFilter);

  const [profileTotals] = await db
    .select({
      total: sql<number>`count(*)::int`,
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
      newProfilesThisPeriod: profileTotals?.total ?? 0,
      newListingsThisPeriod: totals?.total ?? 0,
    }),
  );
});

router.get("/admin/revenue", async (req, res): Promise<void> => {
  const query = AdminGetRevenueQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { year } = query.data;

  const rows = await db.execute(
    year
      ? sql`
          SELECT
            to_char(created_at, 'YYYY-MM') AS month,
            COALESCE(SUM(listing_fee::numeric), 0)::float AS revenue
          FROM listings
          WHERE payment_status = 'completed'
            AND EXTRACT(YEAR FROM created_at) = ${year}
          GROUP BY month
          ORDER BY month
        `
      : sql`
          SELECT
            to_char(created_at, 'YYYY-MM') AS month,
            COALESCE(SUM(listing_fee::numeric), 0)::float AS revenue
          FROM listings
          WHERE payment_status = 'completed'
            AND created_at >= '2026-01-01'
            AND created_at < '2051-01-01'
          GROUP BY month
          ORDER BY month
        `
  );

  const rowArray: any[] = Array.isArray(rows) ? rows : (rows as any).rows ?? [];
  const data = rowArray.map((r) => ({
    month: String(r.month),
    revenue: Number(r.revenue),
  }));

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.json(AdminGetRevenueResponse.parse(data));
});

router.get("/admin/payments", async (req, res): Promise<void> => {
  const query = AdminGetPaymentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const now = new Date();
  const targetYear = query.data.year ?? now.getFullYear();
  const yearStart = new Date(targetYear, 0, 1);
  const yearEnd = new Date(targetYear + 1, 0, 1);

  const rows = await db
    .select({
      id: listingsTable.id,
      title: listingsTable.title,
      category: listingsTable.category,
      listingFee: listingsTable.listingFee,
      paidAt: listingsTable.paidAt,
      createdAt: listingsTable.createdAt,
    })
    .from(listingsTable)
    .where(
      and(
        eq(listingsTable.paymentStatus, "completed"),
        gte(listingsTable.createdAt, yearStart),
        lt(listingsTable.createdAt, yearEnd),
      ),
    )
    .orderBy(desc(listingsTable.paidAt));

  const data = rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    amount: parseFloat(r.listingFee as string),
    paidAt: (r.paidAt ?? r.createdAt).toISOString(),
  }));

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.json(AdminGetPaymentsResponse.parse(data));
});

router.get("/admin/pending-videos", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select({
      listing: listingsTable,
      seller: profilesTable,
    })
    .from(listingsTable)
    .leftJoin(profilesTable, eq(listingsTable.sellerId, profilesTable.id))
    .where(eq(listingsTable.status, "pending_video"))
    .orderBy(desc(listingsTable.createdAt));

  res.json(rows.map(({ listing, seller }) => ({
    id: listing.id,
    title: listing.title,
    price: Number(listing.price),
    category: listing.category,
    location: listing.location,
    videoUrl: (listing as any).videoUrl ?? null,
    imageUrls: listing.imageUrls,
    createdAt: listing.createdAt.toISOString(),
    sellerId: listing.sellerId,
    sellerName: seller?.fullName ?? seller?.username ?? null,
    sellerEmail: (seller as any)?.email ?? null,
  })));
});

router.post("/admin/pending-videos/:id/approve", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { id } = req.params;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  const [listing] = await db
    .update(listingsTable)
    .set({ status: "active", expiryDate })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ok: true });
});

router.post("/admin/pending-videos/:id/reject", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { id } = req.params;
  const { reason } = req.body as { reason?: string };

  const [listing] = await db
    .update(listingsTable)
    .set({ status: "deleted", reportReason: reason ?? "Video-Proof abgelehnt" })
    .where(eq(listingsTable.id, id))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ok: true });
});

router.get("/admin/business-bookings", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select({
      booking: businessBookingsTable,
      profile: profilesTable,
      listing: listingsTable,
    })
    .from(businessBookingsTable)
    .leftJoin(profilesTable, eq(businessBookingsTable.profileId, profilesTable.id))
    .leftJoin(listingsTable, eq(businessBookingsTable.listingId, listingsTable.id))
    .orderBy(desc(businessBookingsTable.createdAt))
    .limit(200);

  res.json(rows.map(({ booking, profile, listing }) => ({
    id: booking.id,
    profileId: booking.profileId,
    companyName: (profile as any)?.companyName ?? profile?.fullName ?? "—",
    vatId: (profile as any)?.vatId ?? null,
    listingTitle: listing?.title ?? "—",
    amount: booking.amount != null ? Number(booking.amount) : null,
    paymentStatus: booking.paymentStatus,
    invoiceNumber: booking.invoiceNumber,
    createdAt: booking.createdAt.toISOString(),
  })));
});

router.patch("/admin/business-bookings/:id/mark-paid", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { id } = req.params;

  const [updated] = await db
    .update(businessBookingsTable)
    .set({ paymentStatus: "paid" })
    .where(eq(businessBookingsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ok: true, invoiceNumber: updated.invoiceNumber });
});

router.get("/admin/market-intelligence", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const rows = await db
    .select()
    .from(searchStatsTable)
    .where(gte(searchStatsTable.lastSearchedAt, since))
    .orderBy(desc(searchStatsTable.searchCount))
    .limit(15);

  res.json(rows.map((r) => ({
    keyword: r.keyword,
    searchCount: r.searchCount,
    listingCount: r.listingCount,
    lastSearchedAt: r.lastSearchedAt.toISOString(),
  })));
});

export default router;
