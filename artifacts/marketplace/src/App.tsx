import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import { useAuth, AuthProvider } from "@workspace/replit-auth-web";
import { useGetProfile } from "@workspace/api-client-react";
import { OnboardingModal } from "@/components/OnboardingModal";
import { LoginModal } from "@/components/LoginModal";
import NotFound from "@/pages/not-found";
import type { FullProfile } from "@/lib/types";

import { Home } from "@/pages/Home";
import { ListingDetail } from "@/pages/ListingDetail";
import { CreateListing } from "@/pages/CreateListing";
import { Messages } from "@/pages/Messages";
import { Profile } from "@/pages/Profile";
import { Admin } from "@/pages/Admin";
import { MyAds } from "@/pages/MyAds";
import { Favourites } from "@/pages/Favourites";
import { CategoryPage } from "@/pages/CategoryPage";
import CryptoPayment from "@/pages/CryptoPayment";
import { Archive } from "@/pages/Archive";
import { CreateSponsoredAd } from "@/pages/CreateSponsoredAd";
import { Impressum } from "@/pages/Impressum";
import { AGB } from "@/pages/AGB";
import { Datenschutz } from "@/pages/Datenschutz";
import { Sicherheit } from "@/pages/Sicherheit";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/my-ads" component={MyAds} />
      <Route path="/favourites" component={Favourites} />
      <Route path="/listings/create" component={CreateListing} />
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/pay/:id" component={CryptoPayment} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/category/:id" component={CategoryPage} />
      <Route path="/archive" component={Archive} />
      <Route path="/ads/create" component={CreateSponsoredAd} />
      <Route path="/impressum" component={Impressum} />
      <Route path="/agb" component={AGB} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/sicherheit" component={Sicherheit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, refetch } = useAuth();
  const { data: profile } = useGetProfile(user?.id ?? "", {
    query: { enabled: !!user?.id },
  });

  const fullProfile = profile as FullProfile | undefined;
  const showOnboarding = !!user && !!fullProfile && !fullProfile.setupComplete;

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingModal
          userId={user.id}
          onComplete={refetch}
        />
      )}
      <LoginModal />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageProvider>
            <AuthProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <OnboardingGate>
                  <Router />
                </OnboardingGate>
              </WouterRouter>
              <Toaster />
            </AuthProvider>
          </LanguageProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
