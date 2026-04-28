import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo/SEO";

export function Datenschutz() {
  return (
    <>
      <SEO
        title="Datenschutzerklärung — DSGVO-konform"
        description="Datenschutzerklärung von Die kleine Börse gemäß DSGVO — transparente Informationen zur Datenverarbeitung für Nutzer in Österreich, Deutschland und der Schweiz."
        url="/datenschutz"
      />
      <div className="min-h-screen bg-[#F8F7F4]">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Datenschutzerklärung</h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-10">Gemäß DSGVO, DSG (AT) & nDSG (CH)</p>

          <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Verantwortlicher</h2>
              <p>Jakob Welik, Österreich<br />
              E-Mail: <a href="mailto:kontakt@diekleineBoerse.at" className="text-slate-800 hover:underline">kontakt@diekleineBoerse.at</a></p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Welche Daten wir erheben</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Nutzerdaten bei der Registrierung (Name, E-Mail via Single Sign-On)</li>
                <li>Anzeigeninhalte (Titel, Beschreibung, Bilder, Preis, Standort)</li>
                <li>Nachrichten zwischen Nutzern (Ende-zu-Ende auf unseren Servern gespeichert)</li>
                <li>Besucherstatistiken (anonymisiert: Land, Seitenaufruf, Zeitstempel)</li>
                <li>Zahlungsinformationen (verarbeitet durch Stripe — wir speichern keine Kartendaten)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Cookies & Technische Daten</h2>
              <p>Wir verwenden ausschließlich technisch notwendige Cookies (Session-Cookie für die Anmeldung). Es werden keine Tracking- oder Werbe-Cookies eingesetzt. Der Session-Cookie wird beim Abmelden oder Schließen des Browsers gelöscht.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Zweck der Datenverarbeitung</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Betrieb und Verbesserung der Plattform</li>
                <li>Abwicklung von Zahlungstransaktionen</li>
                <li>Kommunikation zwischen Käufern und Verkäufern</li>
                <li>Betrugsprävention und Plattformsicherheit</li>
                <li>Anonyme Analyse der Plattformnutzung</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Rechtsgrundlagen</h2>
              <p>Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), lit. c (gesetzliche Verpflichtung) und lit. f (berechtigtes Interesse an sicherem Plattformbetrieb).</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Drittanbieter & Auftragsverarbeitung</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Replit Inc.</strong> – Hosting & Authentifizierung (USA) — Standardvertragsklauseln gem. Art. 46 DSGVO</li>
                <li><strong>Stripe Inc.</strong> – Zahlungsabwicklung (USA) —{" "}
                  <a href="https://stripe.com/at/privacy" target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:underline">
                    Datenschutz Stripe
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Deine Rechte</h2>
              <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Anfragen richten an:{" "}
                <a href="mailto:kontakt@diekleineBoerse.at" className="text-slate-800 hover:underline">kontakt@diekleineBoerse.at</a>
              </p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Speicherdauer</h2>
              <p>Daten werden gelöscht, sobald sie für den jeweiligen Zweck nicht mehr erforderlich sind, oder auf Anfrage. Steuerrelevante Zahlungsdaten werden gemäß gesetzlicher Pflicht 7 Jahre aufbewahrt.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Beschwerderecht</h2>
              <p>
                Du hast das Recht, bei der zuständigen Datenschutzbehörde Beschwerde einzulegen:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>🇦🇹 Österreich: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:underline">www.dsb.gv.at</a></li>
                <li>🇩🇪 Deutschland: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:underline">www.bfdi.bund.de</a></li>
                <li>🇨🇭 Schweiz: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:underline">www.edoeb.admin.ch</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
