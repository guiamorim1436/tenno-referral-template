import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastrarIndicador } from "@/lib/api";
import { normalizePhone } from "@/lib/phone";
import { PhoneInputInternational } from "@/components/PhoneInputInternational";

export default function Indicar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [countryDial, setCountryDial] = useState("55");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const fullPhone = normalizePhone(tel, countryDial);
      if (!fullPhone) {
        throw new Error("Por favor, insira um número de telefone válido.");
      }

      const res = await cadastrarIndicador({ nome, telefone: fullPhone });
      if (!res.magic_token) throw new Error("Falha ao gerar link: token não retornado.");
      toast.success(res.novo ? "Tudo pronto! Aqui está seu link." : "Bem-vindo de volta!");
      setTimeout(() => navigate(`/painel/${res.magic_token}`), 100);
    } catch (err) {
      toast.error((err as Error).message || "Ocorreu um erro ao gerar seu link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell max="sm">
      <h1 className="text-3xl text-primary mb-2 italic">Seja um Embaixador</h1>
      <p className="text-muted-foreground mb-8">
        Preencha seus dados para gerar seu link pessoal de indicação.
      </p>
      <form onSubmit={onSubmit} className="space-y-5">
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
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Gerando seu link..." : "Gerar meu link"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Sem senha. Você recebe um link permanente do seu painel.
        </p>
      </form>
    </PageShell>
  );
}
