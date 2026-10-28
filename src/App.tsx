import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Entrar from "@/pages/Entrar";
import Indicar from "@/pages/Indicar";
import PainelToken from "@/pages/PainelToken";
import RCodigo from "@/pages/RCodigo";
import RCodigoObrigado from "@/pages/RCodigoObrigado";
import AdminLayout from "@/pages/AdminLayout";
import AdminIndex from "@/pages/AdminIndex";
import AdminIndicadores from "@/pages/AdminIndicadores";
import AdminIndicados from "@/pages/AdminIndicados";
import AdminConfiguracoes from "@/pages/AdminConfiguracoes";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/indicar" element={<Indicar />} />
          <Route path="/painel/:token" element={<PainelToken />} />
          <Route path="/r/:codigo" element={<RCodigo />} />
          <Route path="/r/:codigo/obrigado" element={<RCodigoObrigado />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminIndex />} />
            <Route path="indicadores" element={<AdminIndicadores />} />
            <Route path="indicados" element={<AdminIndicados />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
