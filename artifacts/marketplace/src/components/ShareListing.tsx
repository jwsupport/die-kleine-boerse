import { useState } from "react";
import { Share2, Link, Send, Check } from "lucide-react";

interface ShareListingProps {
  title: string;
  listingId: string;
  imageUrl?: string;
  price: number;
  location: string;
}

const BASE_URL = "https://die-kleine-boerse.de";

export function ShareListing({ title, listingId, imageUrl, price, location }: ShareListingProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${BASE_URL}/listings/${listingId}`;
  const shareText = `Entdecke dieses Fundstück auf Die kleine Börse: ${title} — €${price.toLocaleString()} in ${location}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}${imageUrl ? `&media=${encodeURIComponent(imageUrl)}` : ""}`;

  return (
    <div className="flex items-center gap-6 py-6 border-t border-slate-100">
      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 shrink-0">
        Teilen
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={handleNativeShare}
          title="Teilen"
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <Share2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
        </button>

        <a
          href={pinterestUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Auf Pinterest teilen"
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <Send className="w-[18px] h-[18px]" strokeWidth={1.5} />
        </a>

        <button
          onClick={handleCopy}
          title="Link kopieren"
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          {copied ? (
            <Check className="w-[18px] h-[18px] text-green-600" strokeWidth={1.5} />
          ) : (
            <Link className="w-[18px] h-[18px]" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {copied && (
        <span className="text-[11px] text-slate-400 animate-in fade-in slide-in-from-left-2">
          Link kopiert
        </span>
      )}
    </div>
  );
}
