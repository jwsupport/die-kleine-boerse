import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useGetListing } from "@workspace/api-client-react";
import { useT, getCatLabel } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Copy, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STRIPE_LINKS: { maxFee: number; url: string }[] = [
  { maxFee: 1.00, url: "https://buy.stripe.com/8x29AT1dR6EH58P3or4wM00" },
  { maxFee: 5.49, url: "https://buy.stripe.com/4gM00j2hV8MP1WD9MP4wM02" },
  { maxFee: 9.49, url: "https://buy.stripe.com/aFa00jf4H3svbxde354wM03" },
];

function getStripeLink(fee: number): string {
  const match = STRIPE_LINKS.find((l) => Math.abs(l.maxFee - fee) < 0.01);
  return match?.url ?? STRIPE_LINKS[0].url;
}

const USDT_ADDRESS = "TEoXrL4bSj7adM6CbdYowTrdDp6RNuuXZL";
const SOL_ADDRESS = "J7ptr4kryRKb51cSqE66C6qBeUYxHZwmU9q7xCKubCW2";
const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Kopiert!", description: text.slice(0, 24) + "…" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
      title="Kopieren"
    >
      {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

type PayMethod = "card" | "crypto";
type CryptoCoin = "usdt" | "sol";

export default function CryptoPayment() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const t = useT();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [coin, setCoin] = useState<CryptoCoin>("usdt");

  const { data: listing, isLoading } = useGetListing(id ?? "", {
    query: { enabled: !!id } as any,
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
    onSuccess: () => setSubmitted(true),
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
            <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
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

          {/* Header */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">{t.pay_step}</p>
            <h1 className="text-2xl font-medium text-slate-900">{t.pay_title}</h1>
            <p className="text-slate-500 text-sm">{t.pay_subtitle}</p>
          </div>

          {/* Listing info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{t.pay_listing}</p>
            <p className="font-medium text-slate-900">{listing.title}</p>
            <p className="text-xs text-slate-500">{getCatLabel(listing.category, t)}</p>
          </div>

          {/* Amount */}
          <div className="bg-slate-900 rounded-xl p-5 text-white text-center space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{t.pay_amountDue}</p>
            <p className="text-4xl font-light tracking-tight">€{fee.toFixed(2).replace(".", ",")}</p>
            <p className="text-xs text-slate-400">{t.pay_listingFee}</p>
          </div>

          {/* ── Payment method selector ── */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Zahlungsmethode
            </p>

            {/* Two selector cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card */}
              <button
                type="button"
                onClick={() => setPayMethod("card")}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
                  payMethod === "card"
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {payMethod === "card" && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
                )}
                <CreditCard className={`w-6 h-6 ${payMethod === "card" ? "text-white" : "text-slate-500"}`} />
                <span className="text-sm font-medium">{t.pay_method_card}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  payMethod === "card" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>Empfohlen</span>
              </button>

              {/* Crypto */}
              <button
                type="button"
                onClick={() => setPayMethod("crypto")}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
                  payMethod === "crypto"
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {payMethod === "crypto" && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
                )}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-6 h-6 ${payMethod === "crypto" ? "text-white" : "text-slate-500"}`}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 8h4.5a2 2 0 0 1 0 4H9v4" />
                  <path d="M9 12h5.5a2 2 0 0 1 0 4H9" />
                  <path d="M9 6v2m0 8v2" />
                </svg>
                <span className="text-sm font-medium">{t.pay_method_crypto}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  payMethod === "crypto" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>USDT · SOL</span>
              </button>
            </div>
          </div>

          {/* ── Card panel ── */}
          {payMethod === "card" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
                <p className="text-sm text-slate-500">{t.pay_stripe_desc}</p>
                <Button
                  className="w-full h-12 bg-[#635BFF] hover:bg-[#4B44CC] text-white font-medium tracking-wide gap-2"
                  onClick={handleStripeClick}
                >
                  <CreditCard className="w-4 h-4" />
                  {t.pay_stripe_title} — €{fee.toFixed(2).replace(".", ",")}
                </Button>
              </div>
              <div className="border border-slate-100 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-medium text-slate-700 text-center">{t.pay_stripe_done}</p>
                <p className="text-xs text-slate-500 text-center leading-relaxed">{t.pay_instructions}</p>
                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 tracking-wide"
                  onClick={() => notifyPayment.mutate()}
                  disabled={notifyPayment.isPending}
                >
                  {notifyPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {t.pay_confirm}
                </Button>
                <p className="text-xs text-slate-400 text-center">{t.pay_confirmNote}</p>
              </div>
            </div>
          )}

          {/* ── Crypto panel ── */}
          {payMethod === "crypto" && (
            <div className="space-y-4 animate-in fade-in duration-200">

              {/* Warning */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">{t.pay_warning}</p>
              </div>

              {/* Coin switcher */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">{t.pay_crypto_choose}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCoin("usdt")}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      coin === "usdt"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    USDT <span className="text-[10px] font-normal opacity-70">TRC-20</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoin("sol")}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      coin === "sol"
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    SOL <span className="text-[10px] font-normal opacity-70">Solana</span>
                  </button>
                </div>
              </div>

              {/* Wallet card */}
              {coin === "usdt" && (
                <WalletCard
                  label="USDT (TRC-20)"
                  address={USDT_ADDRESS}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                  border="border-emerald-200"
                  fee={fee}
                />
              )}
              {coin === "sol" && (
                <WalletCard
                  label="SOL (Solana)"
                  address={SOL_ADDRESS}
                  color="text-violet-600"
                  bg="bg-violet-50"
                  border="border-violet-200"
                  fee={fee}
                />
              )}

              {/* Confirm button */}
              <div className="border border-slate-100 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-medium text-slate-700 text-center">{t.pay_stripe_done}</p>
                <p className="text-xs text-slate-500 text-center leading-relaxed">{t.pay_instructions}</p>
                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 tracking-wide"
                  onClick={() => notifyPayment.mutate()}
                  disabled={notifyPayment.isPending}
                >
                  {notifyPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {t.pay_crypto_sent}
                </Button>
                <p className="text-xs text-slate-400 text-center">{t.pay_confirmNote}</p>
              </div>
            </div>
          )}

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
  fee,
}: {
  label: string;
  address: string;
  color: string;
  bg: string;
  border: string;
  fee: number;
}) {
  return (
    <div className={`rounded-2xl border-2 ${border} ${bg} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</p>
        <span className={`text-xs font-semibold ${color}`}>€{fee.toFixed(2).replace(".", ",")} senden</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="shrink-0 p-2 bg-white rounded-xl border border-white shadow-sm">
          <img
            src={`${QR_BASE}${encodeURIComponent(address)}`}
            alt={`${label} QR code`}
            width={140}
            height={140}
            className="rounded-lg"
          />
        </div>
        <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
          <p className="text-xs text-slate-500 font-medium">Wallet-Adresse</p>
          <div className="flex items-start justify-center sm:justify-start gap-2">
            <p className="font-mono text-[11px] text-slate-700 break-all leading-relaxed">
              {address}
            </p>
            <CopyButton text={address} />
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Sende exakt den oben angezeigten Betrag. Falsche Beträge können nicht erstattet werden.
          </p>
        </div>
      </div>
    </div>
  );
}
