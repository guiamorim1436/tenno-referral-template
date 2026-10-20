import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { atualizarStatus, getConfigKommo, listarIndicacoes, syncKommoLeads } from "@/lib/api";
import { formatPhoneBR } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";

const STATUSES = ["recebido", "em_contato", "compareceu", "convertido", "encerrado"] as const;

export default function AdminIndicados() {
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["indicacoes"], queryFn: listarIndicacoes });
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: getConfigKommo });

  const [syncing, setSyncing] = useState(false);

  async function sync() {
    setSyncing(true);
    try {
      const res = await syncKommoLeads();
      toast.success(`${res.synced} leads sincronizados com o Kommo`);
      qc.invalidateQueries({ queryKey: ["indicacoes"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  async function change(id: string, status: typeof STATUSES[number]) {
    try {
      await atualizarStatus({ id, status });
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["indicacoes"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Erro ao carregar:</strong> {(error as Error).message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-primary">Indicados</h1>
        <Button variant="outline" size="sm" onClick={sync} disabled={syncing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          Sincronizar Kommo
        </Button>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Indicador</th>
              <th className="p-3">Status Local</th>
              <th className="p-3">Etapa Kommo</th>
              <th className="p-3">Data</th>
              <th className="p-3">Link Kommo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((i: any) => (
              <tr key={i.id}>
                <td className="p-3">{i.nome_indicado}</td>
                <td className="p-3">{formatPhoneBR(i.telefone_indicado)}</td>
                <td className="p-3">{i.indicador?.nome ?? "-"}</td>
                <td className="p-3">
                  <select
                    value={i.status}
                    onChange={(e) => change(i.id, e.target.value as any)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  {i.kommo_status ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {i.kommo_status}
                    </span>
                  ) : "-"}
                </td>
                <td className="p-3 text-muted-foreground">{new Date(i.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="p-3 text-muted-foreground">
                  {i.kommo_lead_id ? (
                    <a
                      href={`https://${config?.subdomain || "crm"}.kommo.com/leads/detail/${i.kommo_lead_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Ver Lead <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(data ?? []).length === 0 && <p className="p-5 text-muted-foreground text-sm">Nenhuma indicação ainda.</p>}
      </div>
    </div>
  );
}
