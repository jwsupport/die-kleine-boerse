import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, listingsTable, searchStatsTable } from "@workspace/db";
import {
  GetCategoryStatsResponse,
  GetRecentListingsQueryParams,
  GetRecentListingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: listingsTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(listingsTable)
    .groupBy(listingsTable.category)
    .orderBy(sql`count(*) desc`);

  res.json(GetCategoryStatsResponse.parse(rows));
});

router.get("/stats/recent", async (req, res): Promise<void> => {
  const query = GetRecentListingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 8;

  const rows = await db
    .select()
    .from(listingsTable)
    .orderBy(sql`${listingsTable.createdAt} desc`)
    .limit(limit);

  res.json(
    GetRecentListingsResponse.parse(
      rows.map((l) => ({
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

router.get("/stats/search-trends", async (_req, res): Promise<void> => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const rows = await db
    .select({
      keyword: searchStatsTable.keyword,
      searchCount: searchStatsTable.searchCount,
    })
    .from(searchStatsTable)
    .where(sql`${searchStatsTable.lastSearchedAt} > ${since}`)
    .orderBy(sql`${searchStatsTable.searchCount} desc`)
    .limit(8);

  res.json(rows.map((r) => r.keyword));
});

export default router;
