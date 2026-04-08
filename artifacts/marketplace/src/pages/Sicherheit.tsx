import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, AlertTriangle, Eye, CreditCard, MessageSquare, Video } from "lucide-react";
import { SEO } from "@/components/seo/SEO";

const tips = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Zu schön um wahr zu sein?",
    text: "Wenn ein Angebot unrealistisch günstig ist, seien Sie vorsichtig. Vergleichen Sie Preise mit ähnlichen Angeboten und vertrauen Sie Ihrem Instinkt.",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Kommunizieren Sie über die Plattform",
    text: "Nutzen Sie das interne Nachrichtensystem für alle Kommunikation. Wechseln Sie nicht zu WhatsApp oder E-Mail, bevor Sie den Verkäufer nicht verifiziert haben.",
  },
  {
    icon: <Video className="w-5 h-5" />,
    title: "Video-Verifizierung nutzen",
    text: "Bitten Sie den Verkäufer, einen kurzen Video-Nachweis des Artikels zu senden. Unsere Plattform unterstützt die Einreichung von Verifizierungsvideos direkt in der Anzeige.",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Sichere Zahlungsweise wählen",
    text: "Zahlen Sie nie per Sofortüberweisung oder Geschenkkarten an unbekannte Personen. Verwenden Sie PayPal (Käuferschutz) oder übergeben Sie Bargeld nur bei persönlicher Übergabe.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Persönliche Übergabe bevorzugen",
    text: "Treffen Sie sich an einem öffentlichen Ort (Café, Einkaufszentrum). Nehmen Sie eine Begleitperson mit. Überprüfen Sie den Artikel vor der Zahlung sorgfältig.",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Verdächtige Anzeigen melden",
    text: "Nutzen Sie die Meldefunktion bei verdächtigen Anzeigen. Unser Team überprüft alle Meldungen und handelt schnell. Ihre Sicherheit hat höchste Priorität.",
  },
];

export function Sicherheit() {
  return (
    <>
      <SEO
        title="Sicherheitstipps"
        description="Tipps für sicheres Kaufen und Verkaufen auf Die kleine Börse."
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
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-10">Sicher kaufen & verkaufen</p>

          <p className="text-sm text-slate-500 mb-10 leading-relaxed">
            Die kleine Börse setzt auf Transparenz und Video-Verifizierung, um Betrug zu minimieren. Folgen Sie diesen Tipps für ein sicheres Erlebnis.
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
              Wenn Sie Betrug bemerken oder Opfer eines Betrugs geworden sind, melden Sie dies sofort über die Anzeige oder per E-Mail an{" "}
              <a href="mailto:noreply@diekleineBoerse.at" className="text-white underline">
                noreply@diekleineBoerse.at
              </a>
              . Bei strafrechtlich relevantem Betrug erstatten Sie bitte auch Anzeige bei der Polizei.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
