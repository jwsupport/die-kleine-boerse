import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, AlertTriangle, Eye, CreditCard, MessageSquare, Video } from "lucide-react";
import { SEO } from "@/components/seo/SEO";

const tips = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Zu schön um wahr zu sein?",
    text: "Wenn ein Angebot unrealistisch günstig ist, sei vorsichtig. Vergleiche Preise mit ähnlichen Angeboten und vertraue deinem Instinkt.",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Kommuniziere über die Plattform",
    text: "Nutze das interne Nachrichtensystem für alle Kommunikation. Wechsle nicht zu WhatsApp oder E-Mail, bevor du den Verkäufer nicht verifiziert hast.",
  },
  {
    icon: <Video className="w-5 h-5" />,
    title: "Video-Verifizierung nutzen",
    text: "Bitte den Verkäufer, einen kurzen Video-Nachweis des Artikels zu schicken. Unsere Plattform unterstützt die Einreichung von Verifizierungsvideos direkt in der Anzeige.",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Sichere Zahlungsweise wählen",
    text: "Zahle nie per Sofortüberweisung oder Geschenkkarten an unbekannte Personen. Verwende PayPal mit Käuferschutz oder übergib Bargeld nur bei persönlicher Übergabe.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Persönliche Übergabe bevorzugen",
    text: "Triff dich an einem öffentlichen Ort (Café, Einkaufszentrum). Nimm eine Begleitperson mit. Überprüfe den Artikel vor der Zahlung sorgfältig.",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Verdächtige Anzeigen melden",
    text: "Nutze die Meldefunktion bei verdächtigen Anzeigen. Unser Team überprüft alle Meldungen und handelt schnell. Deine Sicherheit hat höchste Priorität.",
  },
];

export function Sicherheit() {
  return (
    <>
      <SEO
        title="Sicher kaufen & verkaufen im DACH-Raum"
        description="So schützt du dich beim Kaufen und Verkaufen auf Die kleine Börse: Video-Verifikation, sichere Zahlung, Betrugsschutz — unsere Tipps für Österreich, Deutschland und die Schweiz."
        url="/sicherheit"
      />
      <div className="min-h-screen bg-[#F8F7F4]">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-slate-800" />
            <h1 className="text-3xl font-bold text-slate-900">Sicherheitstipps</h1>
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-10">Sicher kaufen & verkaufen im DACH-Raum</p>

          <p className="text-sm text-slate-500 mb-10 leading-relaxed">
            Die kleine Börse setzt auf Transparenz und Video-Verifizierung, um Betrug zu minimieren. Folge diesen Tipps für ein sicheres Erlebnis auf der Plattform.
          </p>

          <div className="space-y-6">
            {tips.map((tip) => (
              <div key={tip.title} className="flex gap-4 p-5 bg-white rounded-sm border border-slate-100">
                <div className="flex-shrink-0 w-10 h-10 bg-slate-50 rounded-sm flex items-center justify-center text-slate-700">
                  {tip.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{tip.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 bg-slate-900 text-white rounded-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Betrug melden</p>
            <p className="text-sm leading-relaxed text-slate-300">
              Wenn du Betrug bemerkst oder Opfer eines Betrugs geworden bist, melde dies sofort über die Meldefunktion in der Anzeige oder per E-Mail an{" "}
              <a href="mailto:kontakt@diekleineBoerse.at" className="text-white underline">
                kontakt@diekleineBoerse.at
              </a>
              . Bei strafrechtlich relevantem Betrug erstatte bitte auch Anzeige bei der Polizei.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
