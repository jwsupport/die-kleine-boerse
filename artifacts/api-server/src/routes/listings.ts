import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, sql } from "drizzle-orm";
import { db, listingsTable, profilesTable } from "@workspace/db";
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
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/listings", async (req, res): Promise<void> => {
  const query = GetListingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, location, search, minPrice, maxPrice, limit, offset } = query.data;

  const conditions = [];
  if (category) conditions.push(eq(listingsTable.category, category));
  if (location) conditions.push(ilike(listingsTable.location, `%${location}%`));
  if (search) {
    conditions.push(
      sql`(${listingsTable.title} ilike ${'%' + search + '%'} or ${listingsTable.description} ilike ${'%' + search + '%'})`,
    );
  }
  if (minPrice != null) conditions.push(gte(listingsTable.price, String(minPrice)));
  if (maxPrice != null) conditions.push(lte(listingsTable.price, String(maxPrice)));

  const rows = await db
    .select()
    .from(listingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${listingsTable.createdAt} desc`)
    .limit(limit ?? 50)
    .offset(offset ?? 0);

  res.json(
    GetListingsResponse.parse(
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
        createdAt: l.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/listings", async (req, res): Promise<void> => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sellerId, title, description, price, isNegotiable, category, location, imageUrls } =
    parsed.data;

  // Ensure seller profile exists
  const [existingProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, sellerId));

  if (!existingProfile) {
    await db.insert(profilesTable).values({ id: sellerId });
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
    })
    .returning();

  res.status(201).json({
    id: listing.id,
    sellerId: listing.sellerId,
    title: listing.title,
    description: listing.description,
    price: Number(listing.price),
    isNegotiable: listing.isNegotiable,
    category: listing.category,
    location: listing.location,
    imageUrls: listing.imageUrls,
    createdAt: listing.createdAt.toISOString(),
  });
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

  res.json(
    GetListingResponse.parse({
      id: listing.id,
      sellerId: listing.sellerId,
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      isNegotiable: listing.isNegotiable,
      category: listing.category,
      location: listing.location,
      imageUrls: listing.imageUrls,
      createdAt: listing.createdAt.toISOString(),
      seller: {
        id: seller?.id ?? listing.sellerId,
        username: seller?.username ?? null,
        fullName: seller?.fullName ?? null,
        avatarUrl: seller?.avatarUrl ?? null,
        createdAt: seller?.createdAt?.toISOString() ?? new Date().toISOString(),
      },
    }),
  );
});

router.patch("/listings/:id", async (req, res): Promise<void> => {
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

  const updates: Record<string, unknown> = {};
  if (parsed.data.title != null) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.price != null) updates.price = String(parsed.data.price);
  if (parsed.data.isNegotiable != null) updates.isNegotiable = parsed.data.isNegotiable;
  if (parsed.data.category != null) updates.category = parsed.data.category;
  if (parsed.data.location != null) updates.location = parsed.data.location;
  if (parsed.data.imageUrls != null) updates.imageUrls = parsed.data.imageUrls;

  const [listing] = await db
    .update(listingsTable)
    .set(updates)
    .where(eq(listingsTable.id, params.data.id))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.json(
    UpdateListingResponse.parse({
      id: listing.id,
      sellerId: listing.sellerId,
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      isNegotiable: listing.isNegotiable,
      category: listing.category,
      location: listing.location,
      imageUrls: listing.imageUrls,
      createdAt: listing.createdAt.toISOString(),
    }),
  );
});

router.delete("/listings/:id", async (req, res): Promise<void> => {
  const params = DeleteListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [listing] = await db
    .delete(listingsTable)
    .where(eq(listingsTable.id, params.data.id))
    .returning();

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
