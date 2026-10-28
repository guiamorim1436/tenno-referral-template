import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export default function AdminLayout() {
  const navigate = useNavigate();
  async function sair() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-primary font-medium"
      : "text-muted-foreground hover:text-primary";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between">
          <Logo to="/admin" />
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/admin" end className={linkClass}>Início</NavLink>
            <NavLink to="/admin/indicadores" className={linkClass}>Indicadores</NavLink>
            <NavLink to="/admin/indicados" className={linkClass}>Indicados</NavLink>
            <NavLink to="/admin/configuracoes" className={linkClass}>Configurações</NavLink>
            <Button variant="ghost" size="sm" onClick={sair}>Sair</Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
