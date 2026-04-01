import { Router, type IRouter } from "express";
import { eq, and, or, sql } from "drizzle-orm";
import { db, messagesTable, listingsTable, profilesTable } from "@workspace/db";
import {
  GetMessagesParams,
  GetMessagesQueryParams,
  GetMessagesResponse,
  SendMessageParams,
  SendMessageBody,
  GetConversationsQueryParams,
  GetConversationsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/listings/:id/messages", async (req, res): Promise<void> => {
  const params = GetMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = GetMessagesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { userId } = query.data;

  const rows = await db
    .select({
      message: messagesTable,
      sender: profilesTable,
    })
    .from(messagesTable)
    .leftJoin(profilesTable, eq(messagesTable.senderId, profilesTable.id))
    .where(
      and(
        eq(messagesTable.listingId, params.data.id),
        or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId)),
      ),
    )
    .orderBy(messagesTable.createdAt);

  res.json(
    GetMessagesResponse.parse(
      rows.map(({ message, sender }) => ({
        id: message.id,
        listingId: message.listingId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        senderName: sender?.fullName ?? sender?.username ?? null,
      })),
    ),
  );
});

router.post("/listings/:id/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { senderId, receiverId, content } = parsed.data;

  // Ensure sender profile exists
  const [existingSender] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, senderId));
  if (!existingSender) {
    await db.insert(profilesTable).values({ id: senderId });
  }

  // Ensure receiver profile exists
  const [existingReceiver] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, receiverId));
  if (!existingReceiver) {
    await db.insert(profilesTable).values({ id: receiverId });
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      listingId: params.data.id,
      senderId,
      receiverId,
      content,
    })
    .returning();

  const [sender] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, senderId));

  res.status(201).json({
    id: message.id,
    listingId: message.listingId,
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    senderName: sender?.fullName ?? sender?.username ?? null,
  });
});

router.get("/messages/conversations", async (req, res): Promise<void> => {
  const query = GetConversationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { userId } = query.data;

  // Get distinct conversations (listing + other user pairs)
  const convRows = await db
    .select({
      listingId: messagesTable.listingId,
      otherUserId: sql<string>`case when ${messagesTable.senderId} = ${userId} then ${messagesTable.receiverId} else ${messagesTable.senderId} end`,
      lastMessage: sql<string>`last_value(${messagesTable.content}) over (partition by ${messagesTable.listing_id}, case when ${messagesTable.sender_id} = ${userId} then ${messagesTable.receiver_id} else ${messagesTable.sender_id} end order by ${messagesTable.created_at} rows between unbounded preceding and unbounded following)`,
      lastMessageAt: sql<Date>`last_value(${messagesTable.created_at}) over (partition by ${messagesTable.listing_id}, case when ${messagesTable.sender_id} = ${userId} then ${messagesTable.receiver_id} else ${messagesTable.sender_id} end order by ${messagesTable.created_at} rows between unbounded preceding and unbounded following)`,
    })
    .from(messagesTable)
    .where(or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId)));

  // Deduplicate
  const seen = new Set<string>();
  const conversations = [];
  for (const row of convRows) {
    const key = `${row.listingId}:${row.otherUserId}`;
    if (!seen.has(key)) {
      seen.add(key);
      conversations.push(row);
    }
  }

  // Enrich with listing and profile info
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const [listing] = await db
        .select()
        .from(listingsTable)
        .where(eq(listingsTable.id, conv.listingId));
      const [otherUser] = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, conv.otherUserId));

      return {
        listingId: conv.listingId,
        listingTitle: listing?.title ?? "Deleted listing",
        listingImage: listing?.imageUrls?.[0] ?? null,
        otherUserId: conv.otherUserId,
        otherUserName: otherUser?.fullName ?? otherUser?.username ?? null,
        lastMessage: conv.lastMessage ?? "",
        lastMessageAt:
          conv.lastMessageAt instanceof Date
            ? conv.lastMessageAt.toISOString()
            : String(conv.lastMessageAt),
        unreadCount: 0,
      };
    }),
  );

  res.json(GetConversationsResponse.parse(enriched));
});

export default router;
