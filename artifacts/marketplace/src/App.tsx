import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/Home";
import { ListingDetail } from "@/pages/ListingDetail";
import { CreateListing } from "@/pages/CreateListing";
import { Messages } from "@/pages/Messages";
import { Profile } from "@/pages/Profile";
import { Admin } from "@/pages/Admin";
import { MyAds } from "@/pages/MyAds";
import { CategoryPage } from "@/pages/CategoryPage";
import CryptoPayment from "@/pages/CryptoPayment";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/my-ads" component={MyAds} />
      <Route path="/listings/create" component={CreateListing} />
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/pay/:id" component={CryptoPayment} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/category/:id" component={CategoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </LanguageProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
