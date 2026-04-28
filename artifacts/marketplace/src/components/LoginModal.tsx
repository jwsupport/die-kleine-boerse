import { useState, useRef } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "login" | "register";

interface ApiError {
  error?: string;
}

export function LoginModal() {
  const { modalOpen, closeModal, refetch } = useAuth();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  if (!modalOpen) return null;

  function reset() {
    setEmail("");
    setPassword("");
    setFirstName("");
    setShowPw(false);
    setError(null);
    setLoading(false);
  }

  function close() {
    reset();
    closeModal();
  }

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
    setPassword("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      tab === "login"
        ? { email, password }
        : { email, password, firstName: firstName.trim() || undefined };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as ApiError;

      if (!res.ok) {
        setError(data.error ?? "Ein Fehler ist aufgetreten.");
        setLoading(false);
        return;
      }

      refetch();
      close();
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) close();
      }}
    >
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200/80 overflow-hidden">
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors z-10"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 mb-1">
            die kleine börse
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            {tab === "login" ? "Willkommen zurück" : "Konto erstellen"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {tab === "login"
              ? "Melde dich an, um Anzeigen zu inserieren."
              : "Registriere dich kostenlos — in 30 Sekunden."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/60">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium transition-colors",
                tab === t
                  ? "text-slate-900 border-b-2 border-slate-900 bg-white"
                  : "text-slate-400 hover:text-slate-600",
              ].join(" ")}
            >
              {t === "login" ? (
                <><LogIn className="w-3.5 h-3.5" /> Anmelden</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /> Registrieren</>
              )}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-8 py-6 space-y-4">
          {tab === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="lm-firstname" className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                Vorname <span className="text-slate-400 normal-case tracking-normal">(optional)</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="lm-firstname"
                  type="text"
                  autoComplete="given-name"
                  placeholder="z.B. Anna"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-9 border-slate-200 focus:border-slate-400 focus:ring-0 bg-slate-50/50"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="lm-email" className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              E-Mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="lm-email"
                type="email"
                autoComplete="email"
                placeholder="name@beispiel.at"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 border-slate-200 focus:border-slate-400 focus:ring-0 bg-slate-50/50"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lm-password" className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              Passwort {tab === "register" && <span className="text-slate-400 normal-case tracking-normal">(min. 8 Zeichen)</span>}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="lm-password"
                type={showPw ? "text" : "password"}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10 border-slate-200 focus:border-slate-400 focus:ring-0 bg-slate-50/50"
                required
                minLength={tab === "register" ? 8 : 1}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg h-11 text-sm mt-1"
          >
            {loading
              ? "…"
              : tab === "login"
              ? "Anmelden"
              : "Konto erstellen"}
          </Button>
        </form>

        <div className="px-8 pb-6 -mt-2 text-center">
          <p className="text-[12px] text-slate-400">
            {tab === "login" ? (
              <>Noch kein Konto?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="text-slate-700 font-medium hover:underline"
                >
                  Jetzt registrieren
                </button>
              </>
            ) : (
              <>Bereits registriert?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="text-slate-700 font-medium hover:underline"
                >
                  Anmelden
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
