import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { getPainel, getPublicConfig } from "@/lib/api";

export default function PainelToken() {
  const { token = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["painel", token],
    queryFn: () => getPainel({ token }),
  });
  const { data: config } = useQuery({ queryKey: ["public-config"], queryFn: getPublicConfig });
  const nomePlataforma = config?.nome_plataforma || "Programa de Indicação";

  useEffect(() => {
    document.title = `${nomePlataforma} · programa de indicação`;
  }, [nomePlataforma]);

  if (isLoading) {
    return <PageShell><p className="text-muted-foreground">Carregando...</p></PageShell>;
  }
  if (error || !data) {
    return (
      <PageShell>
        <h1 className="text-2xl text-primary">Link inválido</h1>
        <p className="text-muted-foreground mt-2">Esse link expirou ou não existe.</p>
      </PageShell>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/r/${data.indicador.codigo_indicacao}`;
  const total = data.indicacoes.length;

  return (
    <PageShell>
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="text-3xl text-primary">{data.indicador.nome}</h1>
        {total > 0 && (
          <p className="text-muted-foreground">
            Você já indicou {total} {total === 1 ? "pessoa" : "pessoas"} para nós
          </p>
        )}
      </section>

      <ShareCard link={link} nome={data.indicador.nome} />

      <section className="mt-10">
        <h2 className="text-xl text-primary mb-3">Suas indicações</h2>
        {data.indicacoes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            Quando alguém entrar pelo seu link, aparecerá aqui.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.indicacoes.map((i) => (
              <li key={i.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{i.nome_indicado}</p>
                  <p className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

function ShareCard({ link, nome }: { link: string; nome: string }) {
  const [copied, setCopied] = useState(false);
  const msg = `Oi! Quero te indicar a clínica que me cuida. É só abrir esse link: ${link}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;

  async function copiar() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-8 rounded-2xl bg-secondary p-5 space-y-3">
      <p className="text-sm text-muted-foreground">Seu link pessoal</p>
      <p className="font-mono text-sm break-all text-primary">{link}</p>
      <div className="flex gap-2 pt-2">
        <Button onClick={copiar} variant="outline" className="flex-1">
          {copied ? "Copiado ✓" : "Copiar link"}
        </Button>
        <Button asChild className="flex-1">
          <a href={waUrl} target="_blank" rel="noreferrer">Compartilhar no WhatsApp</a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground pt-1">
        Salve essa página nos favoritos — é o seu acesso permanente, {nome.split(" ")[0]}.
      </p>
    </section>
  );
}
