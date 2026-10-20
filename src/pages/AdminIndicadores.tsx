import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listarIndicadores, premiarIndicador } from "@/lib/api";
import { formatPhoneBR } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Gift, ExternalLink, Copy } from "lucide-react";

export default function AdminIndicadores() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["indicadores"], queryFn: listarIndicadores });
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const mutation = useMutation({
    mutationFn: premiarIndicador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicadores"] });
      toast.success("Prêmio registrado e pontos descontados!");
      setSelectedIndicador(null);
    },
    onError: (error) => {
      toast.error("Erro ao premiar: " + error.message);
    }
  });

  const [selectedIndicador, setSelectedIndicador] = useState<any>(null);
  const [pontos, setPontos] = useState("1");
  const [comentario, setComentario] = useState("");

  const handlePremiar = () => {
    if (!selectedIndicador) return;
    mutation.mutate({
      indicador_id: selectedIndicador.id,
      pontos: parseInt(pontos),
      comentario
    });
  };

  const copyLink = (codigo: string) => {
    const url = `${origin}/r/${codigo}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-primary font-bold">Indicadores</h1>
      </div>
      
      <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b bg-muted/50">
            <tr>
              <th className="p-4 font-medium">Nome / Contato</th>
              <th className="p-4 font-medium text-center">Data Entrada</th>
              <th className="p-4 font-medium text-center">Cliques no Link</th>
              <th className="p-4 font-medium text-center">Pontos Convertidos</th>
              <th className="p-4 font-medium text-center">Saldo</th>
              <th className="p-4 font-medium text-center">Pontos Consumidos</th>
              <th className="p-4 font-medium">Link / Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((i) => {
              const saldo = (i.convertidos || 0) - (i.pontos_consumidos || 0);
              const cliques = i.total || 0;
              return (
                <tr key={i.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-foreground">{i.nome}</div>
                    <div className="text-xs text-muted-foreground">{formatPhoneBR(i.telefone)}</div>
                  </td>
                  <td className="p-4 text-center text-xs text-muted-foreground">
                    {i.created_at ? new Date(i.created_at).toLocaleDateString("pt-BR") : "-"}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                      {cliques} cliques
                    </span>
                  </td>
                  <td className="p-4 text-center font-medium text-muted-foreground">
                    {i.convertidos || 0}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${saldo > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {saldo} pt
                    </span>
                  </td>
                  <td className="p-4 text-center text-muted-foreground">
                    {i.pontos_consumidos || 0}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyLink(i.codigo_indicacao)}
                        title="Copiar link"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-2 py-1 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>/r/{i.codigo_indicacao}</span>
                      </button>
                      <a 
                        href={`${origin}/r/${i.codigo_indicacao}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-primary p-1"
                        title="Abrir link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      
                      <Dialog open={selectedIndicador?.id === i.id} onOpenChange={(open) => !open && setSelectedIndicador(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="default" 
                            size="sm" 
                            disabled={saldo <= 0}
                            onClick={() => {
                              setSelectedIndicador(i);
                              setPontos("1");
                              setComentario("");
                            }}
                            className="h-7 text-xs gap-1.5 ml-2 rounded-full px-3"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            Premiar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Premiar {i.nome}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="pontos">Pontos a descontar (Saldo atual: {saldo})</Label>
                              <Input 
                                id="pontos" 
                                type="number" 
                                min="1" 
                                max={saldo}
                                value={pontos} 
                                onChange={(e) => setPontos(e.target.value)} 
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="comentario">Descrição do prêmio</Label>
                              <Textarea 
                                id="comentario" 
                                placeholder="Ex: Voucher massagem, Procedimento facial..." 
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedIndicador(null)}>Cancelar</Button>
                            <Button 
                              onClick={handlePremiar} 
                              disabled={mutation.isPending || !pontos || parseInt(pontos) <= 0 || parseInt(pontos) > saldo}
                            >
                              {mutation.isPending ? "Salvando..." : "Confirmar Prêmio"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(data ?? []).length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Nenhum indicador registrado.</p>
          </div>
        )}
      </div>
      
      <div className="bg-muted/30 p-4 rounded-xl text-xs text-muted-foreground border border-dashed border-border">
        <strong>Regra do Programa:</strong> Cada indicado convertido dá 1 ponto. O saldo é atualizado automaticamente ao registrar prêmios concedidos.
      </div>
    </div>
  );
}
