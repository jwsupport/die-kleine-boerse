import { Router, type IRouter } from "express";
import { db, listingsTable, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const ADMIN_EMAIL = "welik.jakob@gmail.com";
const router: IRouter = Router();

async function sendPaymentNotificationEmail(
  listing: typeof listingsTable.$inferSelect,
  seller: typeof profilesTable.$inferSelect | undefined,
) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT ?? "587");

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(
      `[Notify] SMTP not configured — email skipped. Listing awaiting approval: ${listing.id} "${listing.title}"`,
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const adminUrl = domain ? `https://${domain}/admin` : "https://localhost/admin";

  await transporter.sendMail({
    from: `"Die kleine Börse" <${smtpUser}>`,
    to: ADMIN_EMAIL,
    subject: `Zahlung eingegangen – "${listing.title}"`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;max-width:560px;margin:auto;color:#0f172a;">
        <div style="background:#0f172a;padding:28px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;font-size:16px;font-weight:400;letter-spacing:0.12em;text-transform:uppercase;margin:0;">DIE KLEINE BÖRSE</h1>
          <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:6px 0 0 0;">Admin-Benachrichtigung</p>
        </div>
        <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="font-size:20px;font-weight:400;margin:0 0 8px 0;">Neue Zahlung eingegangen</h2>
          <p style="color:#64748b;margin:0 0 28px 0;font-size:14px;">Ein Nutzer hat eine Krypto-Zahlung gemeldet und wartet auf Freischaltung der Anzeige.</p>

          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;color:#64748b;font-size:13px;width:130px;">Anzeige</td>
              <td style="padding:12px 16px;font-weight:500;font-size:14px;">${listing.title}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;color:#64748b;font-size:13px;">Kategorie</td>
              <td style="padding:12px 16px;font-size:14px;">${listing.category}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;color:#64748b;font-size:13px;">Preis</td>
              <td style="padding:12px 16px;font-size:14px;">€${Number(listing.price).toLocaleString("de-DE")}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;color:#64748b;font-size:13px;">Listing-Gebühr</td>
              <td style="padding:12px 16px;font-size:14px;font-weight:600;">€${Number(listing.listingFee).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;color:#64748b;font-size:13px;">Verkäufer</td>
              <td style="padding:12px 16px;font-size:14px;">${seller?.fullName ?? seller?.username ?? "Unbekannt"}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#64748b;font-size:13px;">Anzeigen-ID</td>
              <td style="padding:12px 16px;font-family:monospace;font-size:12px;color:#94a3b8;">${listing.id}</td>
            </tr>
          </table>

          <div style="margin-top:28px;text-align:center;">
            <a href="${adminUrl}" style="display:inline-block;background:#0f172a;color:white;padding:14px 36px;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;letter-spacing:0.06em;">
              Admin-Dashboard öffnen →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">Bitte prüfe die Zahlung und aktiviere die Anzeige im Dashboard.</p>
        </div>
      </div>
    `,
  });
}

router.post("/listings/:id/notify-payment", async (req, res): Promise<void> => {
  const { id } = req.params;

  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, id));

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  await db
    .update(listingsTable)
    .set({ paymentStatus: "pending", status: "pending" })
    .where(eq(listingsTable.id, id));

  const [seller] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, listing.sellerId));

  try {
    await sendPaymentNotificationEmail(listing, seller);
  } catch (err) {
    console.error("[Notify] Email send failed:", err);
  }

  res.json({ ok: true });
});

export default router;
