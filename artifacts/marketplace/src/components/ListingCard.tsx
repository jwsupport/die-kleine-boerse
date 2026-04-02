import { Link } from "wouter";
import { Listing } from "@workspace/api-client-react";
import { motion } from "framer-motion";
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
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-slate-100">
          {listing.imageUrls && listing.imageUrls.length > 0 ? (
            <img
              src={listing.imageUrls[0]}
              alt={`${listing.title} — ${listing.location}`}
              loading="lazy"
              decoding="async"
              className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
              itemProp="image"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
              No image
            </div>
          )}
          <div className="absolute top-1.5 right-1.5">
            <FavouriteButton listingId={listing.id} />
          </div>
          {listing.listingType === "paid" && (
            <div className="absolute bottom-1.5 left-1.5">
              <span className="text-[8px] uppercase tracking-widest font-bold bg-slate-900/90 text-white px-1.5 py-0.5 rounded-sm">
                Premium
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1 flex flex-col flex-1">
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
            className={`font-medium text-slate-900 leading-snug line-clamp-2 ${isSmall ? "text-xs" : "text-sm md:text-base"}`}
            itemProp="name"
          >
            {listing.title}
          </h3>

          <div
            className={`font-semibold text-slate-900 mt-auto ${isSmall ? "text-xs" : "text-sm md:text-base"}`}
            itemProp="offers"
            itemScope
            itemType="https://schema.org/Offer"
          >
            <meta itemProp="priceCurrency" content="EUR" />
            <span itemProp="price" content={String(listing.price)}>
              €{listing.price.toLocaleString()}
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
