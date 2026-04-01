import { Link } from "wouter";
import { Listing } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useT, getCatLabel } from "@/lib/i18n";

interface ListingCardProps {
  listing: Listing;
  index?: number;
}

export function ListingCard({ listing, index = 0 }: ListingCardProps) {
  const t = useT();
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="group h-full"
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link href={`/listings/${listing.id}`} className="block h-full flex flex-col space-y-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-slate-100">
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
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              No image
            </div>
          )}
        </div>
        
        <div className="space-y-1.5 flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-medium text-slate-500" itemProp="category">
              {getCatLabel(listing.category, t)}
            </span>
            <span className="text-xs text-slate-400 truncate ml-2">{listing.location}</span>
          </div>
          
          <h3 className="text-lg font-medium text-slate-900 leading-tight line-clamp-2" itemProp="name">
            {listing.title}
          </h3>
          
          <div
            className="text-base font-semibold text-slate-900 mt-auto pt-1"
            itemProp="offers"
            itemScope
            itemType="https://schema.org/Offer"
          >
            <meta itemProp="priceCurrency" content="EUR" />
            <span itemProp="price" content={String(listing.price)}>
              €{listing.price.toLocaleString()}
            </span>
            {listing.isNegotiable && <span className="text-sm font-normal text-slate-500 ml-1">VB</span>}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
