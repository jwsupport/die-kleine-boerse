import { useState } from "react";
import { Briefcase, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProfileQueryKey } from "@workspace/api-client-react";

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

export function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [accountType, setAccountType] = useState<"private" | "business">("private");
  const [companyName, setCompanyName] = useState("");
  const [vatId, setVatId] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const body: Record<string, unknown> = {
        isBusiness: accountType === "business",
        setupComplete: true,
      };
      if (accountType === "business") {
        body.companyName = companyName.trim() || null;
        body.vatId = vatId.trim() || null;
      } else {
        body.companyName = null;
        body.vatId = null;
      }
      const res = await fetch(`${base}/api/profiles/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      await queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey(userId) });
      onComplete();
    } catch {
      toast({ title: "Fehler", description: "Bitte versuche es erneut.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md mx-4 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-slate-50">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-3">
            Die Kleine Börse
          </p>
          <h2 className="text-2xl font-light text-slate-900 tracking-tight">
            Willkommen
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-light">
            Bitte wähle deinen Kontotyp, um fortzufahren.
          </p>
        </div>

        {/* Toggle */}
        <div className="px-8 pt-8">
          <div className="flex bg-slate-50 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setAccountType("private")}
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${
                accountType === "private"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Privat
            </button>
            <button
              onClick={() => setAccountType("business")}
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${
                accountType === "business"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Gewerbe
            </button>
          </div>

          {/* Description cards */}
          {accountType === "private" ? (
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Privatkonto</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ideal für Privatverkäufe. Verkaufe Einzelstücke, Möbel, Kunst und mehr — einfach und diskret.
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 mb-6">
              <div className="bg-slate-50 rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Gewerblicher Partner</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Für Händler, Makler und Galerien. Erhalte das PRO-Badge und Zugang zu Rechnungsstellung.
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Firmenname (z.B. Musterfirma GmbH)"
                  maxLength={120}
                  className="border-slate-200 focus-visible:ring-slate-300 rounded-xl h-12"
                />
                <Input
                  value={vatId}
                  onChange={e => setVatId(e.target.value)}
                  placeholder="USt-IdNr. (z.B. DE123456789) — optional"
                  maxLength={30}
                  className="border-slate-200 focus-visible:ring-slate-300 rounded-xl h-12"
                />
                <p className="text-[10px] text-slate-400 italic px-1">
                  Als Gewerbekunde erhalten Sie Rechnungsbelege mit ausgewiesener MwSt.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8">
          <Button
            onClick={handleSubmit}
            disabled={saving || (accountType === "business" && !companyName.trim())}
            className="w-full h-13 text-[11px] font-bold uppercase tracking-[0.2em] rounded-2xl bg-slate-900 hover:bg-black"
          >
            {saving ? "Wird gespeichert…" : "Weiter →"}
          </Button>
          <p className="text-[10px] text-slate-400 text-center mt-3">
            Diese Einstellung kann jederzeit im Profil geändert werden.
          </p>
        </div>
      </div>
    </div>
  );
}
