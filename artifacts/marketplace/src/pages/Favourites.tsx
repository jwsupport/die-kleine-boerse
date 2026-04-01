import { useAuth } from "@workspace/replit-auth-web";
import { useGetFavourites, getFavouritesQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Star } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Favourites() {
  const t = useT();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  const { data: listings, isLoading } = useGetFavourites({
    query: {
      queryKey: getFavouritesQueryKey(),
      enabled: isAuthenticated,
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 md:px-8 py-12 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-slate-100 rounded-sm" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 md:px-8 py-24 max-w-4xl text-center">
          <Star className="w-12 h-12 stroke-slate-200 mx-auto mb-6" />
          <h1 className="text-2xl font-medium tracking-tight text-slate-900 mb-4">
            {t.favourites_title}
          </h1>
          <p className="text-slate-500 mb-8">{t.favourites_emptyDesc}</p>
          <Button onClick={login} className="bg-slate-900 hover:bg-slate-800 text-white">
            {t.nav_signIn}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-8 py-10 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight text-slate-900">
            {t.favourites_title}
          </h1>
          {listings && listings.length > 0 && (
            <p className="text-slate-500 text-sm mt-1">{listings.length} Artikel</p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-slate-100 rounded-sm" />
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Star className="w-12 h-12 stroke-slate-200 mb-6" />
            <p className="text-lg font-medium text-slate-900 mb-2">{t.favourites_empty}</p>
            <p className="text-sm text-slate-500 mb-8">{t.favourites_emptyDesc}</p>
            <Link href="/">
              <Button variant="outline">Zur Startseite</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
