import { useLanguage } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 text-xs font-semibold tracking-wider">
      <button
        onClick={() => setLang("de")}
        className={`px-1.5 py-1 rounded transition-colors ${
          lang === "de"
            ? "text-slate-900"
            : "text-slate-400 hover:text-slate-700"
        }`}
        aria-label="Deutsch"
      >
        DE
      </button>
      <span className="text-slate-200 select-none">|</span>
      <button
        onClick={() => setLang("en")}
        className={`px-1.5 py-1 rounded transition-colors ${
          lang === "en"
            ? "text-slate-900"
            : "text-slate-400 hover:text-slate-700"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
