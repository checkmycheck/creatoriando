import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import { RouteTransition } from "./components/RouteTransition";
import { useTheme } from "./hooks/useTheme";
import { useFavicon } from "./hooks/useFavicon";
import { useCacheVersion } from "./hooks/useCacheVersion";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateCharacter from "./pages/CreateCharacter";
import Characters from "./pages/Characters";
import PromptResult from "./pages/PromptResult";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import BuyCredits from "./pages/BuyCredits";
import Subscription from "./pages/Subscription";
import Referrals from "./pages/Referrals";
import CreditHistory from "./pages/CreditHistory";
import Generators from "./pages/Generators";
import CreateGenerator from "./pages/CreateGenerator";
import CreateWithGenerator from "./pages/CreateWithGenerator";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useTheme();
  useFavicon();
  useCacheVersion();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* Protected routes with shared DashboardLayout and RouteTransition */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteTransition>
                      <Outlet />
                    </RouteTransition>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/create" element={<CreateCharacter />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/prompt-result" element={<PromptResult />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/buy-credits" element={<BuyCredits />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/credit-history" element={<CreditHistory />} />
              <Route path="/generators" element={<Generators />} />
              <Route path="/create-generator" element={<CreateGenerator />} />
              <Route path="/create-with-generator/:generatorId" element={<CreateWithGenerator />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
