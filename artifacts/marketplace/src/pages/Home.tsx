import { useState } from "react";
import { useGetListings, useGetCategoryStats, getGetListingsQueryKey, getGetCategoryStatsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const [location, setLocation] = useState("");

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

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        <header className="mb-12 space-y-8">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-slate-900">
            Find something special.
          </h1>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search items..." 
                className="pl-10 bg-white border-slate-200 focus-visible:ring-slate-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative md:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Location" 
                className="pl-10 bg-white border-slate-200 focus-visible:ring-slate-300"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setCategory(undefined)}
              className={`whitespace-nowrap text-sm font-medium transition-colors ${!category ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All Items
            </button>
            {stats?.map((stat) => (
              <button
                key={stat.category}
                onClick={() => setCategory(stat.category)}
                className={`whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2 ${category === stat.category ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {stat.category}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{stat.count}</span>
              </button>
            ))}
          </div>
        </header>

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
            <h3 className="text-xl font-medium text-slate-900 mb-2">No items found</h3>
            <p className="text-slate-500">We couldn't find any listings matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
