import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { SEO } from "@/components/seo/SEO";
import { Archive as ArchiveIcon, Package } from "lucide-react";

interface ArchivedListing {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  imageUrls: string[];
  createdAt: string;
  sellerName: string | null;
}

export function Archive() {
  const [listings, setListings] = useState<ArchivedListing[]>([]);
  const [loading, setLoading] = useState(true);

  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");

  useEffect(() => {
    fetch(`${base}/api/listings/archive?limit=24`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <SEO
        title="Archiv — Verkaufte Raritäten & Preisgeschichte"
        description="Das Archiv von Die kleine Börse — entdecke bereits verkaufte Einzelstücke, Vintage-Objekte und Preisreferenzen aus dem DACH-Raum."
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ArchiveIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Preisgeschichte</p>
              <h1 className="text-3xl font-light text-slate-900">Das Archiv</h1>
            </div>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
            Verkaufte Objekte verschwinden nicht — sie werden Teil unserer Geschichte.
            Das Archiv dient als Referenz für Marktwerte und als Inspiration für Sammler.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">Das Archiv ist noch leer.</p>
            <p className="text-slate-300 text-xs mt-1">Verkaufte Anzeigen erscheinen hier.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => (
              <Link key={l.id} to={`/listings/${l.id}`}>
                <div className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer">
                  {/* Sold overlay badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 bg-slate-900/80 text-white rounded-full backdrop-blur-sm">
                      Verkauft
                    </span>
                  </div>

                  {/* Image */}
                  <div className="aspect-square bg-slate-100 overflow-hidden">
                    {l.imageUrls[0] ? (
                      <img
                        src={l.imageUrls[0]}
                        alt={l.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[30%]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs font-medium text-slate-700 line-clamp-1 mb-1">{l.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light text-slate-900">
                        €{l.price.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-slate-400">{l.location}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(l.createdAt).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 py-8 text-center">
        <p className="text-xs text-slate-400">
          Archiv • Die kleine Börse •{" "}
          <Link to="/" className="hover:text-slate-700 transition-colors">Zurück zur Startseite</Link>
        </p>
      </footer>
    </div>
  );
}
