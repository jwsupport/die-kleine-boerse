import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetListing, getGetListingQueryKey, 
  useGetRecentListings, getGetRecentListingsQueryKey, 
  useSendMessage,
  useGetProfileRatings, getGetProfileRatingsQueryKey,
  useReportListing
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, ArrowRight, Star, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ListingCard } from "@/components/ListingCard";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo/SEO";
import { useT, getCatLabel } from "@/lib/i18n";
import { ListingSchema, BreadcrumbSchema } from "@/components/seo/schemas";

export function ListingDetail() {
  const t = useT();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState("");
  const [isMessaging, setIsMessaging] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    if (search.get("payment") !== "success" || !id) return;

    const verify = async () => {
      try {
        const res = await fetch(`/api/stripe/session-status/${id}`);
        const data = await res.json();
        if (data.status === "completed") {
          await queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(id) });
          toast({ title: t.detail_paymentSuccess, description: t.detail_paymentSuccessDesc });
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch {
        // ignore
      }
    };
    verify();
  }, [id]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const { data: listing, isLoading } = useGetListing(id, {
    query: {
      enabled: !!id,
      queryKey: getGetListingQueryKey(id)
    }
  });

  const { data: sellerRatings } = useGetProfileRatings(listing?.sellerId || "", {
    query: {
      enabled: !!listing?.sellerId,
      queryKey: getGetProfileRatingsQueryKey(listing?.sellerId || "")
    }
  });

  const { data: recentListings } = useGetRecentListings({ limit: 5 }, {
    query: {
      queryKey: getGetRecentListingsQueryKey({ limit: 5 })
    }
  });

  const sendMessage = useSendMessage();
  const reportListing = useReportListing();

  const handleSendMessage = () => {
    if (!message.trim() || !listing) return;
    
    sendMessage.mutate({
      data: {
        senderId: "user-demo-1",
        receiverId: listing.sellerId,
        content: message
      }
    }, {
      onSuccess: () => {
        toast({ title: t.detail_messageSent, description: t.detail_messageSentDesc });
        setMessage("");
        setIsMessaging(false);
      }
    });
  };

  const handleReport = () => {
    if (!reportReason.trim() || !listing) return;
    reportListing.mutate({
      id,
      data: { reason: reportReason }
    }, {
      onSuccess: () => {
        toast({ title: t.detail_reportSent, description: t.detail_reportSentDesc, variant: "destructive" });
        setReportReason("");
        setPopoverOpen(false);
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background"><Navbar /></div>;
  }

  if (!listing) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Listing not found</div>;
  }

  const seoDescription = listing.description
    ? listing.description.slice(0, 155)
    : `${listing.title} — €${listing.price.toLocaleString()} in ${listing.location}. Available on Die kleine Börse.`;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <SEO
        title={listing.title}
        description={seoDescription}
        image={listing.imageUrls?.[0] ?? undefined}
        url={`/listings/${listing.id}`}
        type="product"
      />
      <ListingSchema
        id={listing.id}
        title={listing.title}
        description={listing.description}
        price={listing.price}
        imageUrl={listing.imageUrls?.[0]}
        seller={listing.seller.fullName ?? listing.seller.username ?? undefined}
        location={listing.location}
        url={`/listings/${listing.id}`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: getCatLabel(listing.category, t), url: `/?category=${encodeURIComponent(listing.category)}` },
          { name: listing.title, url: `/listings/${listing.id}` },
        ]}
      />

      <Navbar />

      <main className="flex-1">
        <article className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            {/* Images */}
            <div className="space-y-4">
              {listing.imageUrls && listing.imageUrls.length > 0 ? (
                <div className="aspect-[4/5] md:aspect-[3/4] relative bg-slate-100 rounded-sm overflow-hidden">
                  <img src={listing.imageUrls[0]} alt={listing.title} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="aspect-[4/5] bg-slate-100 rounded-sm flex items-center justify-center text-slate-400">
                  No images
                </div>
              )}
              {listing.imageUrls && listing.imageUrls.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {listing.imageUrls.slice(1).map((url, i) => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-sm overflow-hidden">
                      <img src={url} alt="" className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col pt-4 md:pt-12">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs uppercase tracking-widest font-medium text-slate-500">
                  {getCatLabel(listing.category, t)}
                </span>
                
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition-colors">
                      <Flag className="w-3 h-3" /> {t.detail_report}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-slate-900">{t.detail_report}</h4>
                      <Input 
                        placeholder={t.detail_reportPlaceholder}
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-sm h-9"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setPopoverOpen(false)}>{t.profile_cancel}</Button>
                        <Button variant="destructive" size="sm" className="h-8" onClick={handleReport} disabled={reportListing.isPending || !reportReason.trim()}>
                          {t.detail_reportSubmit}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-medium text-slate-900 mb-6 leading-tight">
                {listing.title}
              </h1>
              
              <div className="text-2xl md:text-3xl font-medium text-slate-900 mb-8">
                €{listing.price.toLocaleString()}
                {listing.isNegotiable && <span className="text-lg text-slate-500 ml-2 font-normal">{t.detail_negotiable}</span>}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-12">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {listing.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {listing.daysAge === 0
                    ? "Listed today"
                    : `Listed ${listing.daysAge} day${listing.daysAge !== 1 ? "s" : ""} ago`}
                </div>
                {listing.listingType === "paid" && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold bg-slate-900 text-white px-2 py-0.5 rounded-sm">
                    Premium
                  </span>
                )}
                {listing.expiryDate && (
                  <span className="text-xs text-slate-400">
                    Expires {formatDistanceToNow(new Date(listing.expiryDate), { addSuffix: true })}
                  </span>
                )}
              </div>

              <div className="prose prose-slate max-w-none mb-12">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {listing.description || "No description provided."}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-8 mt-auto">
                <Link href={`/profile/${listing.sellerId}`} className="block group mb-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-slate-100 transition-all">
                      <AvatarImage src={listing.seller.avatarUrl || undefined} />
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        {listing.seller.fullName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-slate-900 group-hover:underline decoration-slate-300 underline-offset-4">{listing.seller.fullName || 'Anonymous'}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-slate-500">{t.profile_memberSince} {new Date(listing.seller.createdAt).getFullYear()}</span>
                        {sellerRatings && sellerRatings.totalRatings > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center text-sm font-medium text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-current mr-1" />
                              {sellerRatings.averageRating?.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {!isMessaging ? (
                  <Button 
                    className="w-full h-14 text-base rounded-sm"
                    onClick={() => setIsMessaging(true)}
                  >
                    {t.detail_contact}
                  </Button>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <Textarea 
                      placeholder={`Hi ${listing.seller.fullName?.split(' ')[0] || 'there'}, is this still available?`}
                      className="min-h-[120px] resize-none border-slate-200 focus-visible:ring-slate-300"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-sm"
                        onClick={() => setIsMessaging(false)}
                      >
                        {t.profile_cancel}
                      </Button>
                      <Button 
                        className="flex-1 rounded-sm gap-2"
                        onClick={handleSendMessage}
                        disabled={sendMessage.isPending || !message.trim()}
                      >
                        {t.detail_send} <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Related */}
        {recentListings && recentListings.filter(l => l.id !== listing.id).length > 0 && (
          <section className="border-t border-slate-200 bg-slate-50/50">
            <div className="container mx-auto px-4 md:px-8 py-16 max-w-7xl">
              <h2 className="text-2xl font-medium text-slate-900 mb-8">{t.detail_similar}</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {recentListings.filter(l => l.id !== listing.id).slice(0, 4).map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
