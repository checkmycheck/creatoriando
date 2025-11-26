import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import { RouteTransition } from "./components/RouteTransition";
import { useTheme } from "./hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateCharacter from "./pages/CreateCharacter";
import Characters from "./pages/Characters";
import PromptResult from "./pages/PromptResult";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import BuyCredits from "./pages/BuyCredits";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useTheme();

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
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteTransition>
                      <CreateCharacter />
                    </RouteTransition>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/characters"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteTransition>
                      <Characters />
                    </RouteTransition>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prompt-result"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteTransition>
                      <PromptResult />
                    </RouteTransition>
                  </DashboardLayout>
                </ProtectedRoute>
                }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteTransition>
                      <Profile />
                    </RouteTransition>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buy-credits"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteTransition>
                      <BuyCredits />
                    </RouteTransition>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteTransition>
                      <Admin />
                    </RouteTransition>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
