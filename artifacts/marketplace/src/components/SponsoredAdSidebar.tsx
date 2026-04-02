import { useEffect, useState } from "react";
import { ExternalLink, Megaphone } from "lucide-react";
import { Link } from "wouter";

interface SponsoredAd {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  targetUrl: string;
  companyName?: string;
}

export function SponsoredAdSidebar() {
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
    fetch(`${base}/api/sponsored-ads/active`)
      .then(r => r.ok ? r.json() : [])
      .then(setAds)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <aside className="space-y-4">
        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        {[1, 2].map(i => (
          <div key={i} className="h-28 bg-slate-100 rounded-sm animate-pulse" />
        ))}
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Megaphone className="w-3 h-3 text-slate-400" />
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
            Gesponsert
          </span>
        </div>
        <Link href="/ads/create" className="text-[9px] uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
          Buchen
        </Link>
      </div>

      {ads.length === 0 ? (
        <Link href="/ads/create" className="block border border-dashed border-slate-200 rounded-sm p-4 text-center hover:border-slate-400 transition-colors group">
          <Megaphone className="w-5 h-5 text-slate-200 mx-auto mb-2 group-hover:text-slate-400 transition-colors" strokeWidth={1.5} />
          <p className="text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">
            Werbeplatz frei
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">ab €49</p>
        </Link>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <a
              key={ad.id}
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block border border-slate-200 rounded-sm overflow-hidden hover:border-slate-400 transition-colors group bg-white"
            >
              {ad.imageUrl && (
                <div className="aspect-[16/7] bg-slate-100 overflow-hidden">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2">
                  {ad.title}
                </p>
                {ad.description && (
                  <p className="text-[10px] text-slate-500 line-clamp-2">{ad.description}</p>
                )}
                {ad.companyName && (
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">{ad.companyName}</p>
                )}
                <div className="flex items-center gap-1 pt-0.5 text-slate-400">
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span className="text-[9px] truncate">{new URL(ad.targetUrl).hostname}</span>
                </div>
              </div>
            </a>
          ))}

          {/* Promo slot when there's space */}
          {ads.length < 3 && (
            <Link href="/ads/create" className="block border border-dashed border-slate-100 rounded-sm p-3 text-center hover:border-slate-300 transition-colors group">
              <p className="text-[10px] text-slate-300 group-hover:text-slate-500 transition-colors">
                + Hier werben — €49
              </p>
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
