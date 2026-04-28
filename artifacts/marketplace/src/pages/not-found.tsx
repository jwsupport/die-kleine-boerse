import { Link } from "wouter";
import { SEO } from "@/components/seo/SEO";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6">
      <SEO
        title="Seite nicht gefunden — 404"
        description="Diese Seite existiert nicht mehr. Entdecke stattdessen aktuelle Kleinanzeigen auf Die kleine Börse — dem Marktplatz für Österreich, Deutschland und die Schweiz."
      />

      <div className="text-center max-w-md">
        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-300 font-bold mb-6">
          Die kleine Börse
        </p>

        <h1 className="text-8xl font-light text-slate-100 tracking-tighter mb-4 select-none">
          404
        </h1>

        <h2 className="text-xl font-medium text-slate-900 mb-3">
          Seite nicht gefunden
        </h2>

        <p className="text-sm text-slate-400 leading-relaxed mb-10">
          Diese Seite existiert nicht mehr oder wurde verschoben. Vielleicht findest du direkt auf der Startseite, wonach du suchst.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>
      </div>

      <p className="absolute bottom-8 text-[10px] text-slate-200 uppercase tracking-widest">
        Österreich · Deutschland · Schweiz
      </p>
    </div>
  );
}
