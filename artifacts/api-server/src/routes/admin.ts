import { Router, type IRouter } from "express";
import { eq, and, gte, lt, sql, desc } from "drizzle-orm";
import { db, listingsTable, profilesTable, searchStatsTable, businessBookingsTable, sponsoredAdsTable, messagesTable } from "@workspace/db";
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

router.get("/admin/sponsored-ads", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select({ ad: sponsoredAdsTable, profile: profilesTable })
    .from(sponsoredAdsTable)
    .leftJoin(profilesTable, eq(sponsoredAdsTable.profileId, profilesTable.id))
    .orderBy(desc(sponsoredAdsTable.createdAt));

  res.json(rows.map(({ ad, profile }) => ({
    id: ad.id,
    profileId: ad.profileId,
    companyName: (profile as any)?.companyName ?? profile?.fullName ?? "—",
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

function getWeekMonday(d: Date): string {
  const day = d.getUTCDay();
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

router.patch("/admin/sponsored-ads/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { id } = req.params;
  const { status, adminNote, title, description, imageUrl, targetUrl } = req.body;

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (adminNote !== undefined) updates.adminNote = adminNote;
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (targetUrl) updates.targetUrl = targetUrl;

  if (status === "approved") {
    // Load ad to check isPremium
    const [existing] = await db
      .select()
      .from(sponsoredAdsTable)
      .where(eq(sponsoredAdsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const currentMonday = getWeekMonday(new Date());

    if (existing.isPremium) {
      updates.weekStart = currentMonday;
      updates.slotPosition = 0;
    } else {
      let targetMonday = currentMonday;
      let assigned = false;
      for (let attempt = 0; attempt < 52; attempt++) {
        const { rows } = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM sponsored_ads
              WHERE week_start = ${targetMonday}
              AND is_premium = false
              AND status = 'approved'`,
        );
        const cnt = Number((rows[0] as any)?.cnt ?? 0);
        if (cnt < 5) {
          updates.weekStart = targetMonday;
          updates.slotPosition = cnt + 1;
          assigned = true;
          break;
        }
        targetMonday = addWeeks(targetMonday, 1);
      }
      if (!assigned) {
        res.status(409).json({ error: "Alle Slots ausgebucht (52 Wochen im Voraus)." });
        return;
      }
    }
    updates.status = "approved";
  } else if (status) {
    updates.status = status;
  }

  const [updated] = await db
    .update(sponsoredAdsTable)
    .set(updates)
    .where(eq(sponsoredAdsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ok: true, ad: updated, weekStart: updated.weekStart, slotPosition: updated.slotPosition });
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

// ── Admin: alle Gespräche ──────────────────────────────────────────────────
// Spam-Heuristiken
const URL_PATTERN = /https?:\/\/|www\.|\.com|\.net|\.org|\.at|\.de|t\.me|wa\.me|telegram|whatsapp|signal\.me/i;
const CAPS_RATIO_THRESHOLD = 0.6; // mehr als 60 % Großbuchstaben → Spam-Verdacht

function detectSpam(messages: { content: string; senderId: string; createdAt: Date }[]): {
  hasUrl: boolean;
  highFreq: boolean;
  repeatedContent: boolean;
  capsWarning: boolean;
} {
  const hasUrl = messages.some((m) => URL_PATTERN.test(m.content));

  // High-frequency: same sender sends ≥5 messages within any 10-minute window
  let highFreq = false;
  const bySender = new Map<string, Date[]>();
  for (const m of messages) {
    const list = bySender.get(m.senderId) ?? [];
    list.push(m.createdAt);
    bySender.set(m.senderId, list);
  }
  for (const times of bySender.values()) {
    const sorted = times.slice().sort((a, b) => a.getTime() - b.getTime());
    for (let i = 0; i < sorted.length - 4; i++) {
      if (sorted[i + 4]!.getTime() - sorted[i]!.getTime() <= 10 * 60 * 1000) {
        highFreq = true;
        break;
      }
    }
    if (highFreq) break;
  }

  // Repeated content: same content sent >2 times
  const contentCounts = new Map<string, number>();
  for (const m of messages) {
    const key = m.content.trim().toLowerCase();
    contentCounts.set(key, (contentCounts.get(key) ?? 0) + 1);
  }
  const repeatedContent = [...contentCounts.values()].some((c) => c > 2);

  // Excessive caps
  const capsWarning = messages.some((m) => {
    const letters = m.content.replace(/[^a-zA-ZäöüÄÖÜ]/g, "");
    if (letters.length < 10) return false;
    const upper = letters.replace(/[^A-ZÄÖÜ]/g, "");
    return upper.length / letters.length > CAPS_RATIO_THRESHOLD;
  });

  return { hasUrl, highFreq, repeatedContent, capsWarning };
}

// GET /api/admin/conversations  – alle Konversationen
router.get("/admin/conversations", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Alle Nachrichten (max 5000 neueste) laden
  const allMessages = await db
    .select({
      id: messagesTable.id,
      listingId: messagesTable.listingId,
      senderId: messagesTable.senderId,
      receiverId: messagesTable.receiverId,
      content: messagesTable.content,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .orderBy(desc(messagesTable.createdAt))
    .limit(5000);

  // Konversationen gruppieren: key = listingId:sortiertes(senderId,receiverId)-Paar
  type Conv = {
    listingId: string;
    userA: string;
    userB: string;
    messages: typeof allMessages;
    lastAt: Date;
  };
  const convMap = new Map<string, Conv>();
  for (const m of allMessages) {
    const [a, b] = [m.senderId, m.receiverId].sort();
    const key = `${m.listingId}:${a}:${b}`;
    if (!convMap.has(key)) {
      convMap.set(key, { listingId: m.listingId, userA: a!, userB: b!, messages: [], lastAt: m.createdAt });
    }
    const conv = convMap.get(key)!;
    conv.messages.push(m);
    if (m.createdAt > conv.lastAt) conv.lastAt = m.createdAt;
  }

  // Listings + Profile in einer Runde laden
  const listingIds = [...new Set([...convMap.values()].map((c) => c.listingId))];
  const userIds = [...new Set([...convMap.values()].flatMap((c) => [c.userA, c.userB]))];

  const [listings, profiles] = await Promise.all([
    listingIds.length
      ? db.select({ id: listingsTable.id, title: listingsTable.title }).from(listingsTable).where(
          sql`${listingsTable.id} = ANY(${listingIds})`,
        )
      : Promise.resolve([]),
    userIds.length
      ? db.select({ id: profilesTable.id, fullName: profilesTable.fullName, username: profilesTable.username }).from(profilesTable).where(
          sql`${profilesTable.id} = ANY(${userIds})`,
        )
      : Promise.resolve([]),
  ]);

  const listingMap = new Map(listings.map((l) => [l.id, l.title]));
  const profileMap = new Map(profiles.map((p) => [p.id, p.fullName ?? p.username ?? p.id]));

  const result = [...convMap.values()]
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
    .map((conv) => {
      const spam = detectSpam(conv.messages);
      const isSpam = spam.hasUrl || spam.highFreq || spam.repeatedContent || spam.capsWarning;
      const lastMsg = conv.messages.reduce((latest, m) =>
        m.createdAt > latest.createdAt ? m : latest
      );
      return {
        listingId: conv.listingId,
        listingTitle: listingMap.get(conv.listingId) ?? "Gelöschtes Inserat",
        userA: conv.userA,
        userAName: profileMap.get(conv.userA) ?? conv.userA,
        userB: conv.userB,
        userBName: profileMap.get(conv.userB) ?? conv.userB,
        messageCount: conv.messages.length,
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.createdAt.toISOString(),
        isSpam,
        spam,
      };
    });

  res.json(result);
});

// GET /api/admin/conversations/:listingId/:userA/:userB  – vollständiger Thread
router.get("/admin/conversations/:listingId/:userA/:userB", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || (req.user as any).email !== "welik.jakob@gmail.com") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { listingId, userA, userB } = req.params;

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.listingId, listingId),
        sql`(
          (${messagesTable.senderId} = ${userA} AND ${messagesTable.receiverId} = ${userB}) OR
          (${messagesTable.senderId} = ${userB} AND ${messagesTable.receiverId} = ${userA})
        )`,
      ),
    )
    .orderBy(messagesTable.createdAt);

  // Profilnamen
  const ids = [...new Set([userA, userB])];
  const profiles = await db
    .select({ id: profilesTable.id, fullName: profilesTable.fullName, username: profilesTable.username })
    .from(profilesTable)
    .where(sql`${profilesTable.id} = ANY(${ids})`);
  const profileMap = new Map(profiles.map((p) => [p.id, p.fullName ?? p.username ?? p.id]));

  res.json(msgs.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: profileMap.get(m.senderId) ?? m.senderId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    hasUrl: URL_PATTERN.test(m.content),
  })));
});

export default router;
