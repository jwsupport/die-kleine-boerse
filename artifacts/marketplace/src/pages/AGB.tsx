import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo/SEO";

export function AGB() {
  return (
    <>
      <SEO
        title="Allgemeine Geschäftsbedingungen"
        description="AGB von Die kleine Börse — Nutzungsbedingungen für die Kleinanzeigenplattform."
        url="/agb"
      />
      <div className="min-h-screen bg-[#F8F7F4]">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-10">Stand: April 2026</p>

          <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 1 Geltungsbereich</h2>
              <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Online-Kleinanzeigenplattform „Die kleine Börse" (nachfolgend „Plattform"). Mit der Registrierung oder Nutzung der Plattform akzeptiert der Nutzer diese AGB.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 2 Leistungen</h2>
              <p>Die Plattform ermöglicht es privaten und gewerblichen Nutzern, Kleinanzeigen für den Kauf und Verkauf von Waren und Dienstleistungen zu erstellen und zu durchsuchen. Für bestimmte Kategorien (z. B. Fahrzeuge, Immobilien) fällt eine Inserierungsgebühr an.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 3 Registrierung & Nutzerkonto</h2>
              <p>Die Registrierung erfolgt über Replit Auth. Der Nutzer ist für die Geheimhaltung seiner Zugangsdaten verantwortlich. Es ist nur ein Konto pro Person erlaubt.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 4 Inserieren</h2>
              <p>Anzeigen müssen wahrheitsgemäß und vollständig sein. Verboten sind Anzeigen für illegale Waren oder Dienstleistungen, gefälschte Produkte, Waffen und Betäubungsmittel. Der Betreiber behält sich das Recht vor, Anzeigen ohne Angabe von Gründen zu löschen.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 5 Gebühren & Zahlungen</h2>
              <p>Gebührenpflichtige Inserate sowie Boost- und Werbepakete sind im Voraus zu bezahlen. Zahlungen über Stripe oder Krypto sind nicht erstattbar, sofern der Dienst bereits erbracht wurde. Bei technischen Fehlern wird ein Guthaben ausgestellt.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 6 Haftung</h2>
              <p>Der Betreiber haftet nicht für die Richtigkeit von Anzeigeninhalten, Schäden aus Transaktionen zwischen Nutzern oder den Ausfall der Plattform durch höhere Gewalt. Die Haftung ist auf grobe Fahrlässigkeit und Vorsatz beschränkt.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 7 Kündigung</h2>
              <p>Nutzer können ihr Konto jederzeit löschen. Der Betreiber kann Konten bei Verstoß gegen diese AGB ohne Vorankündigung sperren oder löschen.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 8 Anwendbares Recht</h2>
              <p>Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist Wien.</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
