import { Link } from "wouter";
import { MessageSquare, User, Plus, Shield, LogIn, LogOut, LayoutList } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { isAdminEmail } from "@/lib/admin";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";
export function Navbar() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const t = useT();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/">
          <span className="text-slate-900 font-medium tracking-tight text-[15px] select-none">
            die kleine börse
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          <LanguageSwitcher />

          {isAuthenticated && isAdminEmail(user?.email) && (
            <Link href="/admin" className="text-sm font-medium flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors">
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">{t.nav_admin}</span>
            </Link>
          )}

          {isAuthenticated && (
            <Link href="/my-ads" className="text-sm font-medium flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors">
              <LayoutList className="w-4 h-4" />
              <span className="hidden md:inline">{t.nav_myAds}</span>
            </Link>
          )}

          <Link href="/listings/create" className="text-sm font-medium flex items-center gap-1.5 hover:text-slate-600 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">{t.nav_sell}</span>
          </Link>

          <Link href="/messages" className="text-slate-500 hover:text-slate-900 transition-colors">
            <MessageSquare className="w-5 h-5 stroke-[1.5]" />
          </Link>

          {!isLoading && isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${user.id}`}
                className="text-slate-500 hover:text-slate-900 transition-colors"
                title={user.firstName ?? user.email ?? "Profile"}
              >
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <User className="w-5 h-5 stroke-[1.5]" />
                )}
              </Link>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-slate-900 transition-colors"
                title={t.nav_signOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : !isLoading ? (
            <Button
              variant="outline"
              size="sm"
              onClick={login}
              className="gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.nav_signIn}</span>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
