import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConfigKommo, salvarConfigKommo, testarConfigKommo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function AdminConfiguracoes() {
  const { data, refetch } = useQuery({ queryKey: ["config"], queryFn: getConfigKommo });

  const [subdomain, setSubdomain] = useState("");
  const [token, setToken] = useState("");
  const [pipeline, setPipeline] = useState("");
  const [stage, setStage] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [saving, setSaving] = useState(false);
  const [nomePlataforma, setNomePlataforma] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data) {
      setSubdomain(data.subdomain ?? "");
      setToken(data.bearer_token ?? "");
      setPipeline(data.pipeline_id?.toString() ?? "");
      setStage(data.stage_id?.toString() ?? "");
      setWhatsapp(data.whatsapp_clinica ?? "");
      setMensagem(data.whatsapp_mensagem ?? "");
      setNomePlataforma(data.nome_plataforma ?? "Programa de Indicação");
      setLogoUrl(data.logo_url ?? "");
    }
  }, [data]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await salvarConfigKommo({
        subdomain,
        bearer_token: token,
        pipeline_id: pipeline ? parseInt(pipeline) : null,
        stage_id: stage ? parseInt(stage) : null,
        whatsapp_clinica: whatsapp,
        whatsapp_mensagem: mensagem,
        nome_plataforma: nomePlataforma,
        logo_url: logoUrl,
      });
      toast.success("Configuração salva");
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function testar() {
    const res = await testarConfigKommo();
    if (res.ok) toast.success("Conexão com Kommo OK");
    else toast.error(`Falha: ${res.error}`);
  }

  return (
    <div className="space-y-6 max-w-xl pb-10">
      <h1 className="text-3xl text-primary">Configurações Gerais</h1>
      <form onSubmit={salvar} className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
        <div className="space-y-4 pb-4 border-b">
          <h2 className="text-lg font-medium text-primary/80">Identidade Visual</h2>
          <div className="space-y-2">
            <Label>Nome da Plataforma</Label>
            <Input value={nomePlataforma} onChange={(e) => setNomePlataforma(e.target.value)} placeholder="Ex: Indique a Clínica" />
          </div>
          <div className="space-y-2">
            <Label>Logo da Clínica</Label>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <div className="h-12 w-12 rounded-full border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  <img src={logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const fileExt = file.name.split(".").pop();
                      const filePath = `logo-${Math.random()}.${fileExt}`;
                      const { error: uploadError } = await supabase.storage.from("brand_assets").upload(filePath, file);
                      if (uploadError) throw uploadError;
                      const { data: { publicUrl } } = supabase.storage.from("brand_assets").getPublicUrl(filePath);
                      setLogoUrl(publicUrl);
                      toast.success("Logo carregado. Lembre-se de salvar.");
                    } catch (error) {
                      toast.error("Erro ao carregar logo");
                      console.error(error);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading}
                />
              </div>
            </div>
            {uploading && <p className="text-xs text-muted-foreground">Carregando...</p>}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-primary/80 pt-2">Integração Kommo CRM</h2>
            <span className="text-xs text-muted-foreground">(Opcional)</span>
          </div>
          <p className="text-xs text-muted-foreground">Preencha apenas se a clínica utilizar o Kommo CRM para sincronizar leads.</p>
        </div>
        <div className="space-y-2">
          <Label>Subdomínio</Label>
          <Input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="minhaclinica" />
          <p className="text-xs text-muted-foreground">https://<strong>{subdomain || "subdominio"}</strong>.kommo.com</p>
        </div>
        <div className="space-y-2">
          <Label>Bearer Token (long-lived)</Label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="Cole o token apenas se usar Kommo" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Pipeline ID</Label>
            <Input value={pipeline} onChange={(e) => setPipeline(e.target.value)} inputMode="numeric" />
          </div>
          <div className="space-y-2">
            <Label>Stage ID</Label>
            <Input value={stage} onChange={(e) => setStage(e.target.value)} inputMode="numeric" />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-medium text-primary/80">WhatsApp da Clínica</h2>
          <div className="space-y-2">
            <Label>WhatsApp (com DDD)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511999999999" />
          </div>
          <div className="space-y-2">
            <Label>Mensagem Padrão</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Use [Indicador] para o nome de quem indicou"
            />
          </div>
          <div className="rounded-xl bg-muted/30 p-4 border border-border/50 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview da Mensagem</h3>
            <div className="bg-white rounded-lg p-3 text-sm shadow-sm border border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/20" />
              <p className="whitespace-pre-wrap break-words text-slate-800 leading-relaxed">
                {mensagem.replace(/\[Indicador\]/g, "João da Silva")}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Preview: 10:30 AM</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">WhatsApp</span>
              </div>
            </div>
            
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Links do Sistema</h3>
            <div className="grid gap-2">
              <div className="bg-card border rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-medium text-primary uppercase">Link de Indicação</span>
                <p className="text-xs font-mono text-accent truncate">{window.location.origin}/r/CODIGO</p>
              </div>
              <div className="bg-card border rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-medium text-primary uppercase">Painel do Indicador</span>
                <p className="text-xs font-mono text-accent truncate">{window.location.origin}/painel/TOKEN</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" disabled={saving || uploading}>{saving ? "Salvando..." : "Salvar Configurações"}</Button>
          <Button type="button" variant="outline" onClick={testar}>Testar conexão Kommo</Button>
        </div>
      </form>
    </div>
  );
}
