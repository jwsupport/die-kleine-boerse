import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetListings, getGetListingsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo/SEO";
import { CATEGORIES } from "@/lib/categories";
import { ChevronLeft, Plus } from "lucide-react";
import { useT, getCatLabel } from "@/lib/i18n";

export function CategoryPage() {
  const t = useT();
  const [, params] = useRoute("/category/:id");
  const categoryId = params?.id ?? "";

  const cat = CATEGORIES.find((c) => c.id === categoryId);
  const Icon = cat?.Icon;

  const queryParams = { category: cat?.label };
  const { data: listings, isLoading } = useGetListings(queryParams, {
    query: { queryKey: getGetListingsQueryKey(queryParams), enabled: !!cat },
  });

  if (!cat) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 max-w-7xl py-24 text-center">
          <p className="text-slate-500">{t.detail_notFound}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <SEO
        title={`${getCatLabel(cat.id, t)} kaufen & verkaufen — Die kleine Börse`}
        description={`Entdecke gebrauchte ${getCatLabel(cat.id, t).toLowerCase()} Artikel in deiner Nähe auf Die kleine Börse — fair, sicher und kuratiert.`}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 md:px-8 py-10 max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-900 transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" />
          {t.categoryPage_back}
        </Link>

        <header className="mb-10 flex items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            {Icon && <Icon className="w-8 h-8 text-slate-300" strokeWidth={1.5} />}
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-slate-900">{getCatLabel(cat.id, t)}</h1>
              {cat.fee > 0 && (
                <p className="text-sm text-slate-400 mt-0.5">{t.categoryPage_listingFee}: €{cat.fee.toFixed(2)}</p>
              )}
            </div>
          </div>
          <Link
            href="/listings/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t.categoryPage_createListing}
          </Link>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 gap-y-12">
            {[...Array(8)].map((_, i) => (
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
          <div className="py-24 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-2">
              {Icon && <Icon className="w-7 h-7 text-slate-300" strokeWidth={1.5} />}
            </div>
            <h3 className="text-xl font-medium text-slate-900">{t.categoryPage_noListings}</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-sm">
              {t.categoryPage_noListingsDesc}
            </p>
            <Link
              href="/listings/create"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.categoryPage_listNow}
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
