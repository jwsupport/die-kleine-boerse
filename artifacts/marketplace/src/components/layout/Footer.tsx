import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";

const CATEGORIES = [
  { name: "Wohnen & Interieur",    slug: "living-interior" },
  { name: "Mode & Accessoires",    slug: "fashion-accessories" },
  { name: "Kunst & Sammlerstücke", slug: "art-collectibles" },
  { name: "Technik & Gadgets",     slug: "tech-electronics" },
  { name: "Fahrzeuge & Mobilität", slug: "vehicles-mobility" },
  { name: "Immobilien",            slug: "real-estate" },
  { name: "Freizeit & Hobbies",    slug: "leisure-hobbies" },
  { name: "Dienstleistungen",      slug: "services" },
];

export function Footer() {
  const { lang } = useLanguage();
  const year = new Date().getFullYear();
  const isDE = lang === "de";

  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">

        {/* Brand */}
        <div className="col-span-1">
          <h2 className="text-lg font-bold uppercase tracking-tighter mb-4 text-slate-900">
            Die kleine Börse
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isDE
              ? "Ihr exklusiver Marktplatz für hochwertige Fundstücke, Automobile und Immobilien. Qualität vor Quantität."
              : "Your exclusive marketplace for high-quality finds, automobiles and real estate. Quality over quantity."}
          </p>
        </div>

        {/* Categories — two sub-columns */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-300 mb-2">
              {isDE ? "Kategorien" : "Categories"}
            </h3>
            {CATEGORIES.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="block text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="space-y-3 pt-6">
            {CATEGORIES.slice(4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="block text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="space-y-3">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-300 mb-2">
            {isDE ? "Rechtliches" : "Legal"}
          </h3>
          <Link href="/archive" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
            {isDE ? "Archiv" : "Archive"}
          </Link>
          <Link href="/impressum" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Impressum
          </Link>
          <Link href="/agb" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">
            AGB
          </Link>
          <Link href="/datenschutz" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Datenschutz
          </Link>
          <Link href="/sicherheit" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Sicherheitstipps
          </Link>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-300 uppercase tracking-widest font-medium">
        <p>© {year} Die kleine Börse. Alle Rechte vorbehalten.</p>
        <div className="mt-4 md:mt-0 flex space-x-6">
          <span>Ein Projekt von Jakob Welik</span>
          <span className="text-slate-200">Powered by Speed.it Hosting</span>
        </div>
      </div>
    </footer>
  );
}
