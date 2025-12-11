import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ImportPage from "./pages/ImportPage";
import SetorSelectionPage from "./pages/SetorSelectionPage";
import DashboardPage from "./pages/DashboardPage";
import VisaoAgregadaPage from "./pages/VisaoAgregadaPage";
import TabelaCompletaPage from "./pages/TabelaCompletaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/consultar" element={<SetorSelectionPage />} />
          <Route path="/requisitos" element={<DashboardPage />} />
          <Route path="/consolidado" element={<VisaoAgregadaPage />} />
          <Route path="/tabela" element={<TabelaCompletaPage />} />
          <Route path="/import" element={<ImportPage />} />
          
          {/* Rotas antigas (redirecionamentos) */}
          <Route path="/setor-selection" element={<SetorSelectionPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/visao-agregada" element={<VisaoAgregadaPage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
