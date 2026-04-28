import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo/SEO";

export function Impressum() {
  return (
    <>
      <SEO
        title="Impressum — Die kleine Börse"
        description="Impressum und Anbieterkennzeichnung von Die kleine Börse — Angaben gemäß § 5 ECG (AT), § 5 TMG (DE) und Art. 13 DSGVO."
        url="/impressum"
      />
      <div className="min-h-screen bg-[#F8F7F4]">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Impressum</h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-10">
            Angaben gemäß § 5 ECG (AT) · § 5 TMG (DE) · Art. 13 DSG (CH)
          </p>

          <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Betreiber & Verantwortlicher</h2>
              <p className="font-medium text-slate-800">Jakob Welik</p>
              <p>Österreich</p>
              <p>E-Mail: <a href="mailto:kontakt@diekleineBoerse.at" className="text-slate-800 hover:underline">kontakt@diekleineBoerse.at</a></p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Unternehmensgegenstand</h2>
              <p>Betrieb einer Online-Kleinanzeigenplattform für private und gewerbliche Nutzer in Österreich, Deutschland und der Schweiz.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Urheberrecht</h2>
              <p>Die auf dieser Website veröffentlichten Inhalte (Texte, Grafiken, Logo) unterliegen dem österreichischen Urheberrecht. Nutzerinhalte (Anzeigen, Bilder) verbleiben im Eigentum der jeweiligen Nutzer. Die Plattform erhält eine beschränkte Lizenz zur Darstellung.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Haftungsausschluss</h2>
              <p>Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Der Betreiber übernimmt jedoch keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Inhalte. Für Inhalte externer Links wird keine Verantwortung übernommen.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Online-Streitbeilegung (EU)</h2>
              <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{" "}
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:underline">
                  ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="mt-2">Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
