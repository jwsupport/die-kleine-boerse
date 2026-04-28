import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo/SEO";

export function AGB() {
  return (
    <>
      <SEO
        title="AGB — Allgemeine Geschäftsbedingungen"
        description="Nutzungsbedingungen von Die kleine Börse — dem Kleinanzeigenmarkt für Österreich, Deutschland und die Schweiz. Transparent, fair und DSGVO-konform."
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
              <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Online-Kleinanzeigenplattform „Die kleine Börse" (nachfolgend „Plattform"). Mit der Registrierung oder Nutzung der Plattform akzeptierst du diese AGB. Die Plattform richtet sich an Nutzer in Österreich, Deutschland und der Schweiz.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 2 Leistungen</h2>
              <p>Die Plattform ermöglicht es privaten und gewerblichen Nutzern, Kleinanzeigen für den Kauf und Verkauf von Waren und Dienstleistungen zu erstellen und zu durchsuchen. Für bestimmte Kategorien (z. B. Fahrzeuge, Immobilien) sowie für Premium-Sichtbarkeit kann eine Inserierungsgebühr anfallen.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 3 Registrierung & Nutzerkonto</h2>
              <p>Die Registrierung erfolgt über ein sicheres Anmeldeverfahren (Single Sign-On). Jeder Nutzer ist für die Geheimhaltung seiner Zugangsdaten verantwortlich. Es ist nur ein Konto pro Person erlaubt. Die Angabe falscher Identitätsdaten ist untersagt.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 4 Inserieren</h2>
              <p>Anzeigen müssen wahrheitsgemäß und vollständig sein. Verboten sind Anzeigen für illegale Waren oder Dienstleistungen, gefälschte Produkte, Waffen und Betäubungsmittel. Der Betreiber behält sich das Recht vor, Anzeigen ohne Angabe von Gründen zu entfernen.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 5 Gewerbliche Nutzer</h2>
              <p>Gewerbliche Verkäufer sind zur vollständigen Angabe ihrer Unternehmensidentität verpflichtet (Name, Adresse, UID/Steuernummer). Gewerbliche Anzeigen sind entsprechend zu kennzeichnen. Die Plattform stellt gewerblichen Nutzern auf Anfrage Rechnungen aus.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 6 Gebühren & Zahlungen</h2>
              <p>Gebührenpflichtige Inserate sowie Boost- und Werbepakete sind im Voraus zu bezahlen. Zahlungen über Kreditkarte (Stripe) oder Kryptowährung sind nach Erbringung des Dienstes nicht erstattbar. Bei technischen Fehlern auf unserer Seite wird ein Guthaben ausgestellt.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 7 Haftung</h2>
              <p>Der Betreiber haftet nicht für die Richtigkeit von Anzeigeninhalten, Schäden aus Transaktionen zwischen Nutzern oder den Ausfall der Plattform durch höhere Gewalt. Die Haftung ist auf grobe Fahrlässigkeit und Vorsatz beschränkt.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 8 Kündigung</h2>
              <p>Nutzer können ihr Konto jederzeit löschen. Der Betreiber kann Konten bei Verstoß gegen diese AGB ohne Vorankündigung sperren oder löschen.</p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">§ 9 Anwendbares Recht & Gerichtsstand</h2>
              <p>Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Für Streitigkeiten mit gewerblichen Nutzern gilt Wien als Gerichtsstand. Für Verbraucher gilt das Recht des jeweiligen Wohnsitzlandes (AT/DE/CH).</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
