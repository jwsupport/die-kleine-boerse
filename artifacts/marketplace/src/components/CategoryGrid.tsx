import { Link } from "wouter";
import { CATEGORIES } from "@/lib/categories";

export function CategoryGrid() {
  return (
    <section aria-label="Kategorien" className="py-16 border-t border-slate-100">
      <h2 className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-8 font-semibold text-center">
        Alle Kategorien
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.Icon;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="group p-6 border border-slate-100 rounded-2xl text-center hover:border-slate-300 hover:shadow-sm transition-all duration-300 flex flex-col items-center gap-3"
            >
              <Icon className="w-6 h-6 text-slate-300 group-hover:text-slate-700 transition-colors duration-300" strokeWidth={1.5} />
              <span className="text-sm font-medium text-slate-700 leading-snug">{cat.label}</span>
              {cat.fee > 0 && (
                <span className="text-[10px] text-slate-400 font-normal">ab €{cat.fee.toFixed(2)}</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
