import { ReactNode } from "react";
import { Logo } from "./Logo";

export function PageShell({ children, max = "md" }: { children: ReactNode; max?: "sm" | "md" | "lg" }) {
  const maxClass = max === "sm" ? "max-w-md" : max === "lg" ? "max-w-3xl" : "max-w-xl";
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className={`mx-auto ${maxClass} px-5 py-5 flex items-center justify-center`}>
          <Logo />
        </div>
      </header>
      <main className={`mx-auto ${maxClass} px-5 py-10`}>{children}</main>
      <footer className={`mx-auto ${maxClass} px-5 py-8 text-center text-xs text-muted-foreground`}>
        Programa de Indicação & Recompensas
      </footer>
    </div>
  );
}
