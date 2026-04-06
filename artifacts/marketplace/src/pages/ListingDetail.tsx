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
import { MapPin, Clock, ArrowRight, Star, Flag, Building2, Phone, Globe, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ListingCard } from "@/components/ListingCard";
import { ShareListing } from "@/components/ShareListing";
import { ImageLightbox } from "@/components/ImageLightbox";
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
            <div className="space-y-3">
              {listing.imageUrls && listing.imageUrls.length > 0 ? (
                <div
                  className="aspect-[4/5] md:aspect-[3/4] relative bg-slate-100 rounded-sm overflow-hidden cursor-zoom-in group"
                  onClick={() => setLightboxIndex(0)}
                >
                  <img
                    src={listing.imageUrls[0]}
                    alt={listing.title}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {listing.imageUrls.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                      1 / {listing.imageUrls.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/5] bg-slate-100 rounded-sm flex items-center justify-center text-slate-400 text-sm">
                  Keine Bilder vorhanden
                </div>
              )}
              {listing.imageUrls && listing.imageUrls.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.imageUrls.slice(1).map((url, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-slate-100 rounded-sm overflow-hidden cursor-zoom-in group"
                      onClick={() => setLightboxIndex(i + 1)}
                    >
                      <img
                        src={url}
                        alt={`Bild ${i + 2}`}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-[1.05]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && listing.imageUrls && listing.imageUrls.length > 0 && (
              <ImageLightbox
                images={listing.imageUrls}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onNavigate={setLightboxIndex}
              />
            )}

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
                    ? "Heute inseriert"
                    : `Vor ${listing.daysAge} ${listing.daysAge === 1 ? "Tag" : "Tagen"} inseriert`}
                </div>
                {listing.listingType === "paid" && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold bg-slate-900 text-white px-2 py-0.5 rounded-sm">
                    Top-Inserat
                  </span>
                )}
                {listing.expiryDate && (
                  <span className="text-xs text-slate-400">
                    Läuft ab {formatDistanceToNow(new Date(listing.expiryDate), { addSuffix: true, locale: de })}
                  </span>
                )}
              </div>

              <div className="prose prose-slate max-w-none mb-12">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {listing.description || "Keine Beschreibung vorhanden."}
                </p>
              </div>

              <ShareListing
                title={listing.title}
                listingId={listing.id}
                imageUrl={listing.imageUrls?.[0]}
                price={listing.price}
                location={listing.location}
              />

              <div className="border-t border-slate-200 pt-8 mt-auto">
                {/* Business info card — shown when seller is a business with full address */}
                {(() => {
                  const s = listing.seller as any;
                  const hasAddress = s.isBusiness && s.street && s.postalCode && s.city;
                  return s.isBusiness ? (
                    <div className="mb-6">
                      {/* Header badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-900">
                            Gewerblicher Anbieter
                          </span>
                          {s.companyName && (
                            <span className="block text-xs text-slate-500 leading-none mt-0.5">
                              {s.companyName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Full address card — only when address is complete */}
                      {hasAddress && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-slate-700 leading-snug">
                              {s.companyName && (
                                <p className="font-medium text-slate-900">{s.companyName}</p>
                              )}
                              <p>{s.street}</p>
                              <p>{s.postalCode} {s.city}</p>
                              {s.country && s.country !== "Deutschland" && s.country !== "Austria" && s.country !== "Switzerland" && (
                                <p className="text-slate-500">{s.country}</p>
                              )}
                            </div>
                          </div>

                          {s.phone && (
                            <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60">
                              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <a
                                href={`tel:${s.phone}`}
                                className="text-sm text-slate-700 hover:text-slate-900 transition-colors"
                              >
                                {s.phone}
                              </a>
                            </div>
                          )}

                          {s.website && (
                            <div className="flex items-center gap-3 border-t border-slate-200/60 pt-1">
                              <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <a
                                href={s.website.startsWith("http") ? s.website : `https://${s.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors truncate"
                              >
                                {s.website.replace(/^https?:\/\//, "")}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            </div>
                          )}

                          {s.vatId && (
                            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                              USt-IdNr.: {s.vatId}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                <Link href={`/profile/${listing.sellerId}`} className="block group mb-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-slate-100 transition-all">
                      <AvatarImage src={listing.seller.avatarUrl || undefined} />
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        {listing.seller.fullName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 group-hover:underline decoration-slate-300 underline-offset-4">
                          {listing.seller.fullName || 'Anonymer Nutzer'}
                        </span>
                        {(listing.seller as any).isBusiness && (
                          <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded-full">PRO</span>
                        )}
                      </div>
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
