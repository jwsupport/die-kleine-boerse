import { Router, type IRouter } from "express";
import { eq, avg, count } from "drizzle-orm";
import { db, ratingsTable, profilesTable } from "@workspace/db";
import {
  GetProfileRatingsParams,
  GetProfileRatingsResponse,
  SubmitRatingParams,
  SubmitRatingBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profiles/:id/ratings", async (req, res): Promise<void> => {
  const params = GetProfileRatingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { id } = params.data;

  const rows = await db
    .select({
      rating: ratingsTable,
      rater: profilesTable,
    })
    .from(ratingsTable)
    .leftJoin(profilesTable, eq(ratingsTable.raterId, profilesTable.id))
    .where(eq(ratingsTable.ratedId, id))
    .orderBy(ratingsTable.createdAt);

  const [agg] = await db
    .select({
      avg: avg(ratingsTable.rating),
      total: count(ratingsTable.id),
    })
    .from(ratingsTable)
    .where(eq(ratingsTable.ratedId, id));

  res.json(
    GetProfileRatingsResponse.parse({
      averageRating: agg?.avg != null ? Number(agg.avg) : null,
      totalRatings: Number(agg?.total ?? 0),
      ratings: rows.map(({ rating, rater }) => ({
        id: rating.id,
        raterId: rating.raterId,
        ratedId: rating.ratedId,
        rating: rating.rating,
        comment: rating.comment,
        raterName: rater?.fullName ?? rater?.username ?? null,
        createdAt: rating.createdAt.toISOString(),
      })),
    }),
  );
});

router.post("/profiles/:id/ratings", async (req, res): Promise<void> => {
  const params = SubmitRatingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitRatingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { raterId, rating, comment } = parsed.data;

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  // Ensure rater profile exists
  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, raterId));
  if (!existing) {
    await db.insert(profilesTable).values({ id: raterId });
  }

  const [newRating] = await db
    .insert(ratingsTable)
    .values({
      raterId,
      ratedId: params.data.id,
      rating,
      comment: comment ?? null,
    })
    .returning();

  const [rater] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, raterId));

  res.status(201).json({
    id: newRating.id,
    raterId: newRating.raterId,
    ratedId: newRating.ratedId,
    rating: newRating.rating,
    comment: newRating.comment,
    raterName: rater?.fullName ?? rater?.username ?? null,
    createdAt: newRating.createdAt.toISOString(),
  });
});

export default router;
