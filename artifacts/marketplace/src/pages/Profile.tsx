import { useParams } from "wouter";
import { useGetProfile, getGetProfileQueryKey, useGetProfileListings, getGetProfileListingsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListingCard } from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function Profile() {
  const params = useParams();
  const id = params.id as string;

  const { data: profile, isLoading: loadingProfile } = useGetProfile(id, {
    query: {
      enabled: !!id,
      queryKey: getGetProfileQueryKey(id)
    }
  });

  const { data: listings, isLoading: loadingListings } = useGetProfileListings(id, {
    query: {
      enabled: !!id,
      queryKey: getGetProfileListingsQueryKey(id)
    }
  });

  if (loadingProfile) {
    return <div className="min-h-screen bg-background"><Navbar /></div>;
  }

  if (!profile) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center text-slate-500">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">Profile not found</div>
    </div>;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 md:px-8 py-12 max-w-7xl">
        <header className="flex flex-col items-center text-center mb-16 space-y-4">
          <Avatar className="w-24 h-24 mb-2 shadow-sm border border-slate-100">
            <AvatarImage src={profile.avatarUrl || undefined} />
            <AvatarFallback className="bg-slate-100 text-slate-600 text-2xl">
              {profile.fullName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-3xl font-medium text-slate-900">{profile.fullName || 'Anonymous User'}</h1>
            {profile.username && <p className="text-slate-500 mt-1">@{profile.username}</p>}
          </div>
          <p className="text-sm text-slate-400">
            Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
          </p>
        </header>

        <div className="space-y-6">
          <h2 className="text-xl font-medium text-slate-900 border-b border-slate-200 pb-4">
            Active Listings <span className="text-slate-400 text-sm ml-2 font-normal">{listings?.length || 0}</span>
          </h2>
          
          {loadingListings ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[1,2,3,4].map(i => (
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
            <div className="py-12 text-center text-slate-500">
              No active listings found for this user.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
