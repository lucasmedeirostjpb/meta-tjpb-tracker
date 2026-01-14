import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ImportPage from "./pages/ImportPage";
import SetorSelectionPage from "./pages/SetorSelectionPage";
import DashboardPage from "./pages/DashboardPage";
import VisaoAgregadaPage from "./pages/VisaoAgregadaPage";
import TabelaCompletaPage from "./pages/TabelaCompletaPage";
import MinhasMetasPage from "./pages/MinhasMetasPage";
import HistoricoPage from "./pages/HistoricoPage";
import GerenciamentoAtividadesPage from "./pages/GerenciamentoAtividadesPage";
import EditarRequisitoPage from "./pages/EditarRequisitoPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

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
            <Route path="/tabela" element={<TabelaCompletaPage />} />
            <Route path="/historico" element={<HistoricoPage />} />
            <Route path="/atividades" element={<GerenciamentoAtividadesPage />} />
            
            {/* Rota Secreta - Administração */}
            <Route path="/editar-requisito" element={<EditarRequisitoPage />} />
            
            {/* Rotas Protegidas */}
            <Route 
              path="/minhas-metas" 
              element={
                <ProtectedRoute>
                  <MinhasMetasPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/import" 
              element={
                <ProtectedRoute>
                  <ImportPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Rotas antigas (redirecionamentos) */}
            <Route path="/setor-selection" element={<SetorSelectionPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/visao-agregada" element={<VisaoAgregadaPage />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
