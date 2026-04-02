import { Instagram, Twitter, Share2 } from "lucide-react";

export function SocialPromiseBanner() {
  return (
    <section className="w-full bg-white border-y border-slate-50 py-16 px-6 my-12">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="h-px w-8 bg-slate-200"></div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-blue-600 font-bold">
            Unsere Reichweite, Ihr Erfolg
          </span>
          <div className="h-px w-8 bg-slate-200"></div>
        </div>

        <h2 className="text-2xl md:text-3xl font-light text-slate-900 leading-tight mb-6 italic">
          „Jedes Inserat wird Teil unseres Netzwerks."
        </h2>

        <p className="max-w-2xl mx-auto text-sm text-slate-500 leading-relaxed font-light">
          Egal ob <span className="text-slate-900 font-medium">Privatverkauf</span> oder{" "}
          <span className="text-slate-900 font-medium">Gewerbekollektion</span>:{" "}
          Wir teilen Ihre Anzeige aktiv auf unseren Kanälen wie Instagram, Pinterest und X.
          So garantieren wir, dass Ihr Objekt genau die Aufmerksamkeit erhält, die es verdient.
        </p>

        <div className="flex justify-center gap-8 mt-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          <Instagram size={18} strokeWidth={1} />
          <Twitter size={18} strokeWidth={1} />
          <Share2 size={18} strokeWidth={1} />
        </div>
      </div>
    </section>
  );
}
