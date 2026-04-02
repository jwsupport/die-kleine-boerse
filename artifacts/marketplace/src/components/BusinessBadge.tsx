import { Briefcase } from "lucide-react";

interface BusinessBadgeProps {
  companyName?: string | null;
  size?: "sm" | "md";
}

export function BusinessBadge({ companyName, size = "md" }: BusinessBadgeProps) {
  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 bg-slate-900 text-white rounded-full">
        <Briefcase className="w-2.5 h-2.5" />
        PRO
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-slate-900">
      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-3.5 h-3.5 text-slate-700" />
      </div>
      <div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-900">
          Gewerblicher Anbieter
        </span>
        {companyName && (
          <span className="block text-xs text-slate-500 font-normal leading-none mt-0.5">
            {companyName}
          </span>
        )}
      </div>
    </div>
  );
}
