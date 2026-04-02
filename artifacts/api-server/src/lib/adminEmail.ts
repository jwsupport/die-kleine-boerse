import { logger } from "./logger";

const ADMIN_EMAIL = "welik.jakob@gmail.com";
const FROM_EMAIL = "noreply@diekleineBoerse.at";

async function send(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info({ subject }, "adminEmail: RESEND_API_KEY not set, skipping email");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn({ status: res.status, text }, "adminEmail: Resend returned error");
    } else {
      logger.info({ subject }, "adminEmail: sent");
    }
  } catch (err) {
    logger.error({ err }, "adminEmail: fetch failed");
  }
}

export async function notifyNewUser(user: { id: string; email?: string; username?: string }): Promise<void> {
  await send(
    "🆕 Neuer Benutzer auf die kleine Börse",
    `<p>Ein neuer Benutzer hat sich registriert:</p>
     <ul>
       <li><b>ID:</b> ${user.id}</li>
       <li><b>E-Mail:</b> ${user.email ?? "—"}</li>
       <li><b>Username:</b> ${user.username ?? "—"}</li>
     </ul>`,
  );
}

export async function notifyNewListing(listing: {
  id: string;
  title: string;
  price: number;
  category: string;
  location?: string | null;
  sellerId: string;
}): Promise<void> {
  await send(
    `📦 Neues Inserat: „${listing.title}"`,
    `<p>Ein neues Inserat wurde veröffentlicht:</p>
     <ul>
       <li><b>Titel:</b> ${listing.title}</li>
       <li><b>Preis:</b> €${Number(listing.price).toFixed(2)}</li>
       <li><b>Kategorie:</b> ${listing.category}</li>
       <li><b>Ort:</b> ${listing.location ?? "—"}</li>
       <li><b>Verkäufer-ID:</b> ${listing.sellerId}</li>
     </ul>`,
  );
}

export async function sendWeeklySummary(stats: {
  newUsers: number;
  newListings: number;
  weekStart: string;
  weekEnd: string;
}): Promise<void> {
  await send(
    `📊 Wochenbericht: ${stats.weekStart} – ${stats.weekEnd}`,
    `<h2>Wochenbericht — die kleine Börse</h2>
     <p><b>Zeitraum:</b> ${stats.weekStart} bis ${stats.weekEnd}</p>
     <ul>
       <li>👤 Neue Benutzer: <b>${stats.newUsers}</b></li>
       <li>📦 Neue Inserate: <b>${stats.newListings}</b></li>
     </ul>`,
  );
}
