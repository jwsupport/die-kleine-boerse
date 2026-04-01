import { useParams } from "wouter";
import { useState } from "react";
import { useGetListing, getGetListingQueryKey, useGetRecentListings, getGetRecentListingsQueryKey, useSendMessage } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ListingCard } from "@/components/ListingCard";
import { useToast } from "@/hooks/use-toast";

export function ListingDetail() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  
  const [message, setMessage] = useState("");
  const [isMessaging, setIsMessaging] = useState(false);
  
  const { data: listing, isLoading } = useGetListing(id, {
    query: {
      enabled: !!id,
      queryKey: getGetListingQueryKey(id)
    }
  });

  const { data: recentListings } = useGetRecentListings({ limit: 5 }, {
    query: {
      queryKey: getGetRecentListingsQueryKey({ limit: 5 })
    }
  });

  const sendMessage = useSendMessage();

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
        toast({ title: "Message sent", description: "The seller will get back to you soon." });
        setMessage("");
        setIsMessaging(false);
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background"><Navbar /></div>;
  }

  if (!listing) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Listing not found</div>;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
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
              <span className="text-xs uppercase tracking-widest font-medium text-slate-500 mb-4">
                {listing.category}
              </span>
              
              <h1 className="text-3xl md:text-5xl font-medium text-slate-900 mb-6 leading-tight">
                {listing.title}
              </h1>
              
              <div className="text-2xl md:text-3xl font-medium text-slate-900 mb-8">
                ${listing.price.toLocaleString()}
                {listing.isNegotiable && <span className="text-lg text-slate-500 ml-2 font-normal">VB</span>}
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-12">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {listing.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(listing.createdAt))} ago
                </div>
              </div>

              <div className="prose prose-slate max-w-none mb-12">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {listing.description || "No description provided."}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-8 mt-auto">
                <div className="flex items-center gap-4 mb-8">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={listing.seller.avatarUrl || undefined} />
                    <AvatarFallback className="bg-slate-100 text-slate-600">
                      {listing.seller.fullName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-slate-900">{listing.seller.fullName || 'Anonymous'}</div>
                    <div className="text-sm text-slate-500">Joined {new Date(listing.seller.createdAt).getFullYear()}</div>
                  </div>
                </div>

                {!isMessaging ? (
                  <Button 
                    className="w-full h-14 text-base rounded-sm"
                    onClick={() => setIsMessaging(true)}
                  >
                    Message Seller
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
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 rounded-sm gap-2"
                        onClick={handleSendMessage}
                        disabled={sendMessage.isPending || !message.trim()}
                      >
                        {sendMessage.isPending ? 'Sending...' : (
                          <>Send Message <ArrowRight className="w-4 h-4" /></>
                        )}
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
              <h2 className="text-2xl font-medium text-slate-900 mb-8">Recently added</h2>
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
