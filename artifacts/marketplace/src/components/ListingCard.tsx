import { Link } from "wouter";
import { Listing } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { useT, getCatLabel } from "@/lib/i18n";
import { FavouriteButton } from "./FavouriteButton";

interface ListingCardProps {
  listing: Listing;
  index?: number;
  size?: "sm" | "md";
}

export function ListingCard({ listing, index = 0, size = "md" }: ListingCardProps) {
  const t = useT();
  const isSmall = size === "sm";
  const ext = listing as any;

  const renderBadge = () => {
    if (ext.sellerIsVerified) {
      return (
        <span className="absolute top-2 left-2 z-10 bg-white/85 backdrop-blur-sm text-blue-600 px-2 py-0.5 rounded-full text-[7px] uppercase tracking-widest font-bold border border-blue-100 shadow-sm">
          Verifiziert
        </span>
      );
    }
    if (ext.sellerIsBusiness) {
      return (
        <span className="absolute top-2 left-2 z-10 bg-slate-900 text-white px-2 py-0.5 rounded-full text-[7px] uppercase tracking-widest font-bold shadow-sm">
          PRO
        </span>
      );
    }
    return null;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
      className="group h-full"
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link href={`/listings/${listing.id}`} className="block h-full flex flex-col space-y-2.5">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100 border border-slate-100/80">
          {renderBadge()}
          {listing.imageUrls && listing.imageUrls.length > 0 ? (
            <img
              src={listing.imageUrls[0]}
              alt={`${listing.title} — ${listing.location}`}
              loading="lazy"
              decoding="async"
              className="object-cover w-full h-full transition-transform duration-1000 ease-out group-hover:scale-105"
              itemProp="image"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
              Kein Bild
            </div>
          )}
          <div className="absolute top-1.5 right-1.5">
            <FavouriteButton listingId={listing.id} />
          </div>
          {listing.listingType === "paid" && (
            <div className="absolute bottom-1.5 left-1.5">
              <span className="text-[7px] uppercase tracking-widest font-bold bg-slate-900/90 text-white px-1.5 py-0.5 rounded-full">
                Top
              </span>
            </div>
          )}
          {(ext.viewCount ?? 0) > 0 && (
            <div className="absolute bottom-1.5 right-1.5">
              <span className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[9px] font-medium tabular-nums">
                <Eye className="w-2.5 h-2.5 opacity-80" />
                {(ext.viewCount as number).toLocaleString("de-DE")}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-0.5 flex flex-col flex-1 px-0.5">
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[9px] uppercase tracking-widest font-medium text-slate-400 truncate"
              itemProp="category"
            >
              {getCatLabel(listing.category, t)}
            </span>
            <span className="text-[9px] text-slate-400 truncate shrink-0 ml-1">{listing.location}</span>
          </div>

          <h3
            className={`font-medium text-slate-900 leading-snug line-clamp-2 group-hover:text-slate-600 transition-colors ${isSmall ? "text-xs" : "text-sm"}`}
            itemProp="name"
          >
            {listing.title}
          </h3>

          <div
            className={`font-semibold text-slate-950 mt-auto pt-1 ${isSmall ? "text-xs" : "text-sm"}`}
            itemProp="offers"
            itemScope
            itemType="https://schema.org/Offer"
          >
            <meta itemProp="priceCurrency" content="EUR" />
            <span itemProp="price" content={String(listing.price)}>
              €{listing.price.toLocaleString("de-DE")}
            </span>
            {listing.isNegotiable && (
              <span className="text-xs font-normal text-slate-400 ml-1">VB</span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
