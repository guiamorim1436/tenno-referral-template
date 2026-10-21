import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { getIndicadorPorCodigo, getPublicConfig, submitIndicacao } from "@/lib/api";
import { normalizePhone } from "@/lib/phone";
import { PhoneInputInternational } from "@/components/PhoneInputInternational";

export default function RCodigo() {
  const { codigo = "" } = useParams();
  const navigate = useNavigate();
  const { data: config } = useQuery({ queryKey: ["public-config"], queryFn: getPublicConfig });
  const nomePlataforma = config?.nome_plataforma || "nossa clínica";

  const [indicador, setIndicador] = useState<{ nome: string } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [countryDial, setCountryDial] = useState("55");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    getIndicadorPorCodigo({
      codigo,
      registrarClique: true,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : undefined,
    })
      .then((d) => setIndicador({ nome: d.nome }))
      .catch((e) => setErro((e as Error).message))
      .finally(() => setCarregando(false));
  }, [codigo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const fullPhone = normalizePhone(tel, countryDial);
      if (!fullPhone) {
        throw new Error("Por favor, insira um número de telefone válido.");
      }

      const res = await submitIndicacao({ codigo, nome, telefone: fullPhone });
      if (res.whatsappUrl) {
        window.location.href = res.whatsappUrl;
      } else {
        navigate(`/r/${codigo}/obrigado`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <PageShell><p className="text-muted-foreground">Carregando...</p></PageShell>;
  if (erro || !indicador) {
    return (
      <PageShell>
        <h1 className="text-2xl text-primary">Link não encontrado</h1>
        <p className="text-muted-foreground mt-2">Verifique o link recebido.</p>
      </PageShell>
    );
  }

  return (
    <PageShell max="sm">
      <h1 className="text-3xl text-primary italic">
        {indicador.nome.split(" ")[0]} recomendou {nomePlataforma} para você
      </h1>

      <p className="text-muted-foreground mt-3">
        Deixe seus dados e nossa equipe entrará em contato com todo o cuidado.
      </p>
      <form onSubmit={onSubmit} className="space-y-5 mt-8">
        <div className="space-y-2">
          <Label htmlFor="nome">Seu nome</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tel">WhatsApp / Telefone</Label>
          <PhoneInputInternational
            id="tel"
            value={tel}
            onChange={setTel}
            countryDial={countryDial}
            onCountryDialChange={setCountryDial}
            required
            disabled={enviando}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={enviando}>
          {enviando ? "Enviando..." : "Quero ser atendido"}
        </Button>
      </form>
    </PageShell>
  );
}
