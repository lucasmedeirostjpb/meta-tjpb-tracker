import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ImportPage from "./pages/ImportPage";
import SetorSelectionPage from "./pages/SetorSelectionPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import HistoricoPage from "./pages/HistoricoPage";
import VisaoAgregadaPage from "./pages/VisaoAgregadaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/consultar" element={<SetorSelectionPage />} />
            <Route path="/requisitos" element={<DashboardPage />} />
            <Route path="/consolidado" element={<VisaoAgregadaPage />} />
            
            {/* Rotas antigas (redirecionamentos) */}
            <Route path="/setor-selection" element={<SetorSelectionPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/visao-agregada" element={<VisaoAgregadaPage />} />
            
            {/* Rotas Protegidas (apenas para autenticados) */}
            <Route 
              path="/import" 
              element={
                <ProtectedRoute>
                  <ImportPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/historico" 
              element={
                <ProtectedRoute>
                  <HistoricoPage />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
