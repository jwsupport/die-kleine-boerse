import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useGetListing } from "@workspace/api-client-react";
import { useT } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Copy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const fee = Number(listing.listingFee ?? 0);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-lg">
        <div className="space-y-8">
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

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">{t.pay_warning}</p>
          </div>

          <div className="space-y-4">
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

          <div className="border-t border-slate-100 pt-6 space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">{t.pay_instructions}</p>
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
