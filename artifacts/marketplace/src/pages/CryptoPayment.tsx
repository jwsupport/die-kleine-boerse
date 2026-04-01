import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useGetListing } from "@workspace/api-client-react";
import { useT } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Copy, AlertCircle, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STRIPE_LINKS: { maxFee: number; url: string }[] = [
  { maxFee: 1.00, url: "https://buy.stripe.com/8x29AT1dR6EH58P3or4wM00" },
  { maxFee: 5.49, url: "https://buy.stripe.com/4gM00j2hV8MP1WD9MP4wM02" },
];

function getStripeLink(fee: number): string {
  const match = STRIPE_LINKS.find((l) => Math.abs(l.maxFee - fee) < 0.01);
  return match?.url ?? STRIPE_LINKS[0].url;
}
const USDT_ADDRESS = "TEoXrL4bSj7adM6CbdYowTrdDp6RNuuXZL";
const SOL_ADDRESS = "J7ptr4kryRKb51cSqE66C6qBeUYxHZwmU9q7xCKubCW2";
const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied!", description: text.slice(0, 20) + "…" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
      title="Copy"
    >
      {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function CryptoPayment() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const t = useT();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [showCrypto, setShowCrypto] = useState(false);

  const { data: listing, isLoading } = useGetListing(id ?? "", {
    enabled: !!id,
  });

  const notifyPayment = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/listings/${id}/notify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast({ title: t.pay_error, variant: "destructive" });
    },
  });

  const fee = Number(listing?.listingFee ?? 0);

  const handleStripeClick = () => {
    const base = getStripeLink(fee);
    const url = `${base}?client_reference_id=${id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (submitted) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex w-16 h-16 rounded-full bg-emerald-50 items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-medium text-slate-900">{t.pay_successTitle}</h1>
              <p className="text-slate-500 text-sm leading-relaxed">{t.pay_successDesc}</p>
            </div>
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              onClick={() => setLocation("/my-ads")}
            >
              {t.pay_myAds}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/")}
            >
              {t.pay_goHome}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">{t.detail_notFound}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-lg">
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">{t.pay_step}</p>
            <h1 className="text-2xl font-medium text-slate-900">{t.pay_title}</h1>
            <p className="text-slate-500 text-sm">{t.pay_subtitle}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{t.pay_listing}</p>
            <p className="font-medium text-slate-900">{listing.title}</p>
            <p className="text-xs text-slate-500">{listing.category}</p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 text-white text-center space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{t.pay_amountDue}</p>
            <p className="text-4xl font-light tracking-tight">€{fee.toFixed(2)}</p>
            <p className="text-xs text-slate-400">{t.pay_listingFee}</p>
          </div>

          {/* ── Primary: Stripe ── */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-700" />
                <h2 className="font-medium text-slate-900">{t.pay_stripe_title}</h2>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Empfohlen
                </span>
              </div>
              <p className="text-sm text-slate-500">{t.pay_stripe_desc}</p>
              <Button
                className="w-full h-12 bg-[#635BFF] hover:bg-[#4B44CC] text-white font-medium tracking-wide gap-2"
                onClick={handleStripeClick}
              >
                <CreditCard className="w-4 h-4" />
                {t.pay_stripe_title} — €{fee.toFixed(2).replace(".", ",")}
              </Button>
            </div>
          </div>

          {/* ── Confirmation after Stripe ── */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-slate-700 text-center">{t.pay_stripe_done}</p>
            <p className="text-xs text-slate-500 text-center leading-relaxed">{t.pay_instructions}</p>
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 tracking-wide"
              onClick={() => notifyPayment.mutate()}
              disabled={notifyPayment.isPending}
            >
              {notifyPayment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t.pay_confirm}
            </Button>
            <p className="text-xs text-slate-400 text-center">{t.pay_confirmNote}</p>
          </div>

          {/* ── Secondary: Crypto (collapsible) ── */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCrypto((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <span>{t.pay_alt_title}</span>
              {showCrypto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCrypto && (
              <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">{t.pay_warning}</p>
                </div>
                <WalletCard
                  label="USDT (TRC-20)"
                  address={USDT_ADDRESS}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                  border="border-emerald-200"
                />
                <WalletCard
                  label="SOL (Solana)"
                  address={SOL_ADDRESS}
                  color="text-violet-600"
                  bg="bg-violet-50"
                  border="border-violet-200"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function WalletCard({
  label,
  address,
  color,
  bg,
  border,
}: {
  label: string;
  address: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4 space-y-3`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <img
          src={`${QR_BASE}${encodeURIComponent(address)}`}
          alt={`${label} QR code`}
          width={120}
          height={120}
          className="rounded-lg border border-white/60 shadow-sm"
        />
        <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
          <p className="text-xs text-slate-500">Wallet address</p>
          <div className="flex items-center justify-center sm:justify-start gap-1">
            <p className="font-mono text-[11px] text-slate-700 break-all leading-relaxed">
              {address}
            </p>
            <CopyButton text={address} />
          </div>
        </div>
      </div>
    </div>
  );
}
