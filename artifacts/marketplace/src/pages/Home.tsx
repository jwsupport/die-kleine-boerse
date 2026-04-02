import { useState, useEffect } from "react";
import { useGetListings, useGetCategoryStats, getGetListingsQueryKey, getGetCategoryStatsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo/SEO";
import { MarketplaceSchema } from "@/components/seo/schemas";
import { categoryByLabel } from "@/lib/categories";
import { CategoryGrid } from "@/components/CategoryGrid";
import { useT, getCatLabel } from "@/lib/i18n";

export function Home() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const [location, setLocation] = useState("");
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [trendingListings, setTrendingListings] = useState<any[]>([]);

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
    fetch(`${base}/api/stats/search-trends`)
      .then((r) => r.ok ? r.json() : [])
      .then(setTrendingKeywords)
      .catch(() => {});
    fetch(`${base}/api/stats/trending-listings`)
      .then((r) => r.ok ? r.json() : [])
      .then(setTrendingListings)
      .catch(() => {});
  }, []);

  const { data: stats } = useGetCategoryStats({
    query: {
      queryKey: getGetCategoryStatsQueryKey(),
    }
  });

  const queryParams = {
    search: search || undefined,
    category: category || undefined,
    location: location || undefined
  };

  const { data: listings, isLoading } = useGetListings(queryParams, {
    query: {
      queryKey: getGetListingsQueryKey(queryParams)
    }
  });

  const pageTitle = category
    ? `${category} — Local Listings`
    : "Local Marketplace for Unique Finds";
  const pageDesc = category
    ? `Browse pre-owned ${category.toLowerCase()} items near you on Die kleine Börse — quality over quantity.`
    : "Buy and sell pre-owned treasures at Die kleine Börse. Your local, secure, and minimalist community marketplace for unique finds.";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <SEO title={pageTitle} description={pageDesc} />
      <MarketplaceSchema />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        <header className="mb-12 space-y-8">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-slate-900">
            {t.home_headline}
          </h1>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder={t.home_searchPlaceholder}
                className="pl-10 bg-white border-slate-200 focus-visible:ring-slate-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative md:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder={t.home_locationPlaceholder}
                className="pl-10 bg-white border-slate-200 focus-visible:ring-slate-300"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {trendingKeywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold shrink-0">
                Häufig gesucht:
              </span>
              {trendingKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setSearch(kw)}
                  className={`px-3.5 py-1 rounded-full text-[11px] border transition-colors ${
                    search === kw
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setCategory(undefined)}
              className={`whitespace-nowrap text-sm font-medium transition-colors px-4 py-2 rounded-full ${!category ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              {t.home_allFilter}
            </button>
            {stats?.map((stat) => {
              const meta = categoryByLabel[stat.category];
              const Icon = meta?.Icon;
              return (
                <button
                  key={stat.category}
                  onClick={() => setCategory(stat.category)}
                  className={`whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full ${category === stat.category ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  {getCatLabel(stat.category, t)}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${category === stat.category ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{stat.count}</span>
                </button>
              );
            })}
          </div>
        </header>

        <section aria-label="Listings">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 gap-y-12">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/5] w-full rounded-sm" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 gap-y-12">
              {listings.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <h3 className="text-xl font-medium text-slate-900 mb-2">{t.home_noItems}</h3>
              <p className="text-slate-500">{t.home_noItemsDesc}</p>
            </div>
          )}
        </section>
      </main>

      {trendingListings.length > 0 && (
        <section className="py-20 bg-slate-50/60 border-t border-slate-100">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-bold mb-2">
                  Market Intelligence
                </p>
                <h2 className="text-3xl font-light text-slate-900">Current Desires</h2>
              </div>
              <p className="text-slate-400 text-sm italic">
                Basierend auf den meistgesuchten Begriffen dieser Woche.
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 gap-y-12">
              {trendingListings.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <CategoryGrid />
      </div>

      <Footer />
    </div>
  );
}
