import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, businessBookingsTable, profilesTable, listingsTable } from "@workspace/db";
import PDFDocument from "pdfkit";

const router = Router();

router.get("/my/business-bookings", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = (req.user as any).id;

  const rows = await db
    .select({
      booking: businessBookingsTable,
      listing: listingsTable,
    })
    .from(businessBookingsTable)
    .leftJoin(listingsTable, eq(businessBookingsTable.listingId, listingsTable.id))
    .where(eq(businessBookingsTable.profileId, userId))
    .orderBy(businessBookingsTable.createdAt);

  res.json(rows.map(({ booking, listing }) => ({
    id: booking.id,
    listingTitle: listing?.title ?? "—",
    amount: booking.amount != null ? Number(booking.amount) : null,
    paymentStatus: booking.paymentStatus,
    invoiceNumber: booking.invoiceNumber,
    createdAt: booking.createdAt.toISOString(),
  })));
});

router.get("/business-bookings/:id/invoice.pdf", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = (req.user as any).id;
  const { id } = req.params;

  const [row] = await db
    .select({
      booking: businessBookingsTable,
      profile: profilesTable,
      listing: listingsTable,
    })
    .from(businessBookingsTable)
    .leftJoin(profilesTable, eq(businessBookingsTable.profileId, profilesTable.id))
    .leftJoin(listingsTable, eq(businessBookingsTable.listingId, listingsTable.id))
    .where(and(
      eq(businessBookingsTable.id, id),
      eq(businessBookingsTable.profileId, userId),
    ));

  if (!row || row.booking.paymentStatus !== "paid") {
    res.status(404).json({ error: "Rechnung nicht gefunden oder noch nicht bezahlt" });
    return;
  }

  const { booking, profile, listing } = row;
  const invoiceNum = booking.invoiceNumber ?? id;
  const amount = booking.amount != null ? Number(booking.amount) : 0;
  const tax = +(amount * 0.19).toFixed(2);
  const net = +(amount - tax).toFixed(2);
  const date = new Date(booking.createdAt).toLocaleDateString("de-DE");
  const companyName = (profile as any)?.companyName ?? profile?.fullName ?? "—";
  const vatId = (profile as any)?.vatId;

  const doc = new PDFDocument({ margin: 60, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="Rechnung-${invoiceNum}.pdf"`);
  doc.pipe(res);

  // Header
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#0f172a")
    .text("DIE KLEINE BÖRSE", { align: "left" })
    .moveDown(0.2);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748b")
    .text("Kuratierter Marktplatz · Betrieben von Jakob Welik", { align: "left" })
    .moveDown(2);

  // Invoice label
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#0f172a")
    .text("RECHNUNG", { align: "left" })
    .moveDown(0.4);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#64748b")
    .text(`Rechnungsnummer: ${invoiceNum}`)
    .text(`Datum: ${date}`)
    .moveDown(1.5);

  // Divider
  doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke().moveDown(1);

  // Recipient
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#0f172a")
    .text("Rechnungsempfänger:")
    .moveDown(0.3);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#334155")
    .text(companyName);

  if (vatId) doc.text(`USt-IdNr.: ${vatId}`);
  doc.moveDown(1.5);

  // Item table header
  const tableTop = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#94a3b8")
    .text("BESCHREIBUNG", 60, tableTop)
    .text("BETRAG", 450, tableTop, { width: 85, align: "right" });

  doc.moveTo(60, tableTop + 16).lineTo(535, tableTop + 16).strokeColor("#e2e8f0").stroke();

  // Item row
  const rowY = tableTop + 24;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#0f172a")
    .text(`Anzeigenplatz: ${listing?.title ?? "Anzeige"}`, 60, rowY, { width: 350 })
    .text(`€ ${net.toFixed(2)}`, 450, rowY, { width: 85, align: "right" });

  doc.moveDown(3);

  // Totals
  const totalY = doc.y;
  doc.moveTo(350, totalY).lineTo(535, totalY).strokeColor("#e2e8f0").stroke().moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#64748b")
    .text("Nettobetrag:", 350, doc.y, { width: 100 })
    .text(`€ ${net.toFixed(2)}`, 450, doc.y - doc.currentLineHeight(), { width: 85, align: "right" });

  doc.moveDown(0.4);
  doc
    .text("MwSt. 19%:", 350, doc.y, { width: 100 })
    .text(`€ ${tax.toFixed(2)}`, 450, doc.y - doc.currentLineHeight(), { width: 85, align: "right" });

  doc.moveDown(0.4);
  doc.moveTo(350, doc.y).lineTo(535, doc.y).strokeColor("#0f172a").lineWidth(1).stroke().moveDown(0.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text("Gesamtbetrag:", 350, doc.y, { width: 100 })
    .text(`€ ${amount.toFixed(2)}`, 450, doc.y - doc.currentLineHeight(), { width: 85, align: "right" });

  doc.moveDown(3);

  // Footer
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#94a3b8")
    .text("Vielen Dank für Ihr Vertrauen. · Die Kleine Börse · Betrieben von Jakob Welik", {
      align: "center",
    });

  doc.end();
});

export default router;
