import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { getPublicConfig } from "@/lib/api";

export default function Index() {
  const { data } = useQuery({ queryKey: ["public-config"], queryFn: getPublicConfig });
  const nome = data?.nome_plataforma || "Programa de Indicação";

  useEffect(() => {
    document.title = `${nome} · programa de indicação`;
  }, [nome]);

  return (
    <PageShell>
      <section className="space-y-6 text-center">
        <h1 className="text-4xl md:text-5xl text-primary">
          Cuidado e confiança, <em className="italic text-gold">compartilhados</em>.
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
          Indique amigos e familiares para nosso programa de recomendação e seja recompensado pela sua confiança.

        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="rounded-full px-8 shadow-sm"><Link to="/indicar">Quero indicar</Link></Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8 border-border/80"><Link to="/entrar">Acessar meu painel</Link></Button>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { t: "Simples", d: "Preencha nome e WhatsApp." },
          { t: "Pessoal", d: "Você recebe um link só seu." },
          { t: "Acolhedor", d: "Acompanhe quem você indicou." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border/60 bg-card p-5">
            <h3 className="text-xl text-primary">{c.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{c.d}</p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
