import { Link } from "wouter";
import { MessageSquare, User, Plus } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight text-slate-900">
          CURATED.
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/listings/create" className="text-sm font-medium flex items-center gap-2 hover:text-slate-600 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Sell an Item</span>
          </Link>
          <Link href="/messages" className="text-slate-900 hover:text-slate-600 transition-colors">
            <MessageSquare className="w-5 h-5 stroke-[1.5]" />
          </Link>
          <Link href="/profile/user-demo-1" className="text-slate-900 hover:text-slate-600 transition-colors">
            <User className="w-5 h-5 stroke-[1.5]" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
