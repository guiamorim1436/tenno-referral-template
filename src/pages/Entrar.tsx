import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { entrarPorTelefone } from "@/lib/api";
import { normalizePhone } from "@/lib/phone";
import { PhoneInputInternational } from "@/components/PhoneInputInternational";

export default function Entrar() {
  const navigate = useNavigate();
  const [tel, setTel] = useState("");
  const [countryDial, setCountryDial] = useState("55");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const fullPhone = normalizePhone(tel, countryDial);
      if (!fullPhone) {
        throw new Error("Por favor, insira um telefone válido.");
      }
      const res = await entrarPorTelefone({ telefone: fullPhone });
      navigate(`/painel/${res.magic_token}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell max="sm">
      <h1 className="text-3xl text-primary mb-2">Acessar seu painel</h1>
      <p className="text-muted-foreground mb-8">Digite seu WhatsApp para abrir seu painel pessoal.</p>
      <form onSubmit={onSubmit} className="space-y-5">
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
          {loading ? "Abrindo..." : "Abrir painel"}
        </Button>
      </form>
    </PageShell>
  );
}
