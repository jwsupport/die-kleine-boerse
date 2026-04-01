import { useAuth } from "@workspace/replit-auth-web";
import { useGetProfileListings, getGetProfileListingsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Zap } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function MyAds() {
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  const { data: listings, isLoading: listingsLoading } = useGetProfileListings(
    user?.id ?? "",
    {
      query: {
        queryKey: getGetProfileListingsQueryKey(user?.id ?? ""),
        enabled: !!user?.id,
      },
    }
  );

  const handleBoost = async (listingId: string) => {
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Stripe not configured", description: "Payment is not available yet.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not start checkout.", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 md:px-8 py-12 max-w-4xl">
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-sm" />
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
          <h1 className="text-2xl font-medium tracking-tight text-slate-900 mb-4">Sign in to view your ads</h1>
          <p className="text-slate-500 mb-8">You need to be signed in to manage your listings.</p>
          <Button onClick={login} className="bg-slate-900 hover:bg-slate-800 text-white">
            Sign in
          </Button>
        </main>
      </div>
    );
  }

  const myListings = listings ?? [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-8 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-slate-900">My Ads</h1>
            <p className="text-slate-500 text-sm mt-1">
              {myListings.length} listing{myListings.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/listings/create">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
              <Plus className="w-4 h-4" />
              New listing
            </Button>
          </Link>
        </div>

        {listingsLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-sm" />)}
          </div>
        ) : myListings.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">No listings yet.</p>
            <p className="text-sm mt-2">Create your first listing to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myListings.map((listing) => {
              const expiresAt = listing.expiryDate ? new Date(listing.expiryDate) : null;
              const expired = expiresAt ? isPast(expiresAt) : false;
              const isPaid = listing.listingType === "paid";

              return (
                <div key={listing.id} className="flex gap-4 py-5 group">
                  <div className="w-20 h-20 shrink-0 overflow-hidden rounded-sm bg-slate-100">
                    {listing.imageUrls?.[0] ? (
                      <img
                        src={listing.imageUrls[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No image</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/listings/${listing.id}`} className="font-medium text-slate-900 hover:underline truncate">
                        {listing.title}
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        {isPaid ? (
                          <Badge className="bg-slate-900 text-white text-[10px] uppercase tracking-wide px-2 py-0.5">Premium</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide px-2 py-0.5 text-slate-500">Free</Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wide px-2 py-0.5 ${
                            listing.status === "active" ? "text-green-700 border-green-200" :
                            listing.status === "deleted" ? "text-red-500 border-red-200" :
                            "text-slate-500"
                          }`}
                        >
                          {listing.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span className="font-medium text-slate-700">€{Number(listing.price).toFixed(2)}</span>
                      <span>{listing.category}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {listing.daysAge === 0 ? "Today" : `${listing.daysAge}d old`}
                      </span>
                      {expiresAt && (
                        <span className={expired ? "text-red-500" : ""}>
                          {expired ? "Expired" : `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`}
                        </span>
                      )}
                    </div>

                    {!isPaid && listing.status === "active" && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleBoost(listing.id)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          Boost to Premium — €1.00 / 30 days
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
