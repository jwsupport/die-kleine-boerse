import { useParams } from "wouter";
import { useState } from "react";
import { 
  useGetProfile, getGetProfileQueryKey, 
  useGetProfileListings, getGetProfileListingsQueryKey,
  useGetProfileRatings, getGetProfileRatingsQueryKey,
  useSubmitRating
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListingCard } from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function Profile() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: ratingsData, isLoading: loadingRatings } = useGetProfileRatings(id, {
    query: {
      enabled: !!id,
      queryKey: getGetProfileRatingsQueryKey(id)
    }
  });

  const submitRating = useSubmitRating();
  const [ratingVal, setRatingVal] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingForm, setShowRatingForm] = useState(false);

  const handleSubmitRating = () => {
    if (ratingVal === 0) {
      toast({ title: "Select a rating", description: "Please select 1 to 5 stars.", variant: "destructive" });
      return;
    }
    
    submitRating.mutate({
      id,
      data: {
        raterId: "user-demo-1",
        rating: ratingVal,
        comment: ratingComment
      }
    }, {
      onSuccess: () => {
        toast({ title: "Rating submitted", description: "Thank you for your feedback." });
        queryClient.invalidateQueries({ queryKey: getGetProfileRatingsQueryKey(id) });
        setRatingVal(0);
        setRatingComment("");
        setShowRatingForm(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Could not submit rating.", variant: "destructive" });
      }
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} 
      />
    ));
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Main Listings Area */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <h2 className="text-xl font-medium text-slate-900 border-b border-slate-200 pb-4 mb-6">
              Active Listings <span className="text-slate-400 text-sm ml-2 font-normal">{listings?.length || 0}</span>
            </h2>
            
            {loadingListings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3].map(i => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12">
                {listings.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} index={index} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                No active listings found for this user.
              </div>
            )}
          </div>

          {/* Profile Sidebar */}
          <div className="lg:col-span-4 order-1 lg:order-2 space-y-10">
            <header className="flex flex-col items-center text-center space-y-4 bg-slate-50 p-8 rounded-2xl border border-slate-100">
              <Avatar className="w-28 h-28 mb-2 shadow-sm border-2 border-white ring-1 ring-slate-100">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="bg-white text-slate-600 text-3xl">
                  {profile.fullName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-2xl font-medium text-slate-900">{profile.fullName || 'Anonymous User'}</h1>
                {profile.username && <p className="text-slate-500 mt-1">@{profile.username}</p>}
              </div>

              {!loadingRatings && ratingsData && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(ratingsData.averageRating || 0)}
                  </div>
                  <span className="text-sm text-slate-500 font-medium">
                    {ratingsData.totalRatings > 0 
                      ? `${ratingsData.averageRating?.toFixed(1)} (${ratingsData.totalRatings} review${ratingsData.totalRatings !== 1 ? 's' : ''})`
                      : "No ratings yet"}
                  </span>
                </div>
              )}

              <p className="text-sm text-slate-400 pt-4 border-t border-slate-200/60 w-full">
                Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
              </p>
            </header>

            {/* Ratings Section */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <h2 className="text-lg font-medium text-slate-900">Reviews</h2>
                {!showRatingForm && (
                  <Button variant="ghost" size="sm" onClick={() => setShowRatingForm(true)} className="text-sm text-slate-500 hover:text-slate-900">
                    Write a review
                  </Button>
                )}
              </div>

              {showRatingForm && (
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Rate this seller</h3>
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(star => (
                      <button 
                        key={star}
                        type="button"
                        onClick={() => setRatingVal(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none focus-visible:ring-2 rounded ring-slate-300 transition-transform hover:scale-110"
                      >
                        <Star className={`w-6 h-6 transition-colors ${(hoverRating ? star <= hoverRating : star <= ratingVal) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea 
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="Tell others about your experience (optional)"
                    className="min-h-[80px] bg-white resize-none mb-4 text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => {
                      setShowRatingForm(false);
                      setRatingVal(0);
                    }}>Cancel</Button>
                    <Button size="sm" onClick={handleSubmitRating} disabled={submitRating.isPending}>
                      {submitRating.isPending ? 'Submitting...' : 'Submit Rating'}
                    </Button>
                  </div>
                </div>
              )}

              {loadingRatings ? (
                <div className="space-y-4">
                  {[1,2].map(i => (
                    <div key={i} className="flex gap-4 p-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ratingsData?.ratings && ratingsData.ratings.length > 0 ? (
                <div className="space-y-6">
                  {ratingsData.ratings.map(rating => (
                    <div key={rating.id} className="group pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-slate-100 text-xs text-slate-600">
                              {rating.raterName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{rating.raterName || 'Anonymous'}</p>
                            <div className="flex gap-0.5 mt-0.5">
                              {renderStars(rating.rating)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {format(new Date(rating.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      {rating.comment && (
                        <p className="text-sm text-slate-600 mt-3 pl-10 leading-relaxed">
                          {rating.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  No written reviews yet.
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
