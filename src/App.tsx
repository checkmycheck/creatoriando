import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/terms" element={<Terms />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CreateCharacter />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/characters"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Characters />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prompt-result"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PromptResult />
                  </DashboardLayout>
                </ProtectedRoute>
                }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buy-credits"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <BuyCredits />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
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
