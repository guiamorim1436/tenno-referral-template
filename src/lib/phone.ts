export interface CountryDial {
  code: string;       // ISO 2 letras (BR, US, etc)
  name: string;       // Nome legível
  dial: string;       // Prefixo internacional sem + (ex: "55", "1", "351")
  flag: string;       // Emoji da bandeira
  maskPlaceholder: string;
}

export const POPULAR_COUNTRIES: CountryDial[] = [
  { code: "BR", name: "Brasil", dial: "55", flag: "🇧🇷", maskPlaceholder: "(11) 90000-0000" },
  { code: "US", name: "Estados Unidos", dial: "1", flag: "🇺🇸", maskPlaceholder: "(555) 000-0000" },
  { code: "PT", name: "Portugal", dial: "351", flag: "🇵🇹", maskPlaceholder: "912 345 678" },
  { code: "ES", name: "Espanha", dial: "34", flag: "🇪🇸", maskPlaceholder: "612 34 56 78" },
  { code: "GB", name: "Reino Unido", dial: "44", flag: "🇬🇧", maskPlaceholder: "7911 123456" },
  { code: "FR", name: "França", dial: "33", flag: "🇫🇷", maskPlaceholder: "6 12 34 56 78" },
  { code: "IT", name: "Itália", dial: "39", flag: "🇮🇹", maskPlaceholder: "312 345 6789" },
  { code: "DE", name: "Alemanha", dial: "49", flag: "🇩🇪", maskPlaceholder: "151 2345678" },
  { code: "CH", name: "Suíça", dial: "41", flag: "🇨🇭", maskPlaceholder: "79 123 45 67" },
  { code: "AE", name: "Emirados Árabes", dial: "971", flag: "🇦🇪", maskPlaceholder: "50 123 4567" },
  { code: "CA", name: "Canadá", dial: "1", flag: "🇨🇦", maskPlaceholder: "(555) 000-0000" },
  { code: "AU", name: "Austrália", dial: "61", flag: "🇦🇺", maskPlaceholder: "412 345 678" },
  { code: "AR", name: "Argentina", dial: "54", flag: "🇦🇷", maskPlaceholder: "9 11 1234-5678" },
  { code: "CL", name: "Chile", dial: "56", flag: "🇨🇱", maskPlaceholder: "9 1234 5678" },
  { code: "UY", name: "Uruguai", dial: "598", flag: "🇺🇾", maskPlaceholder: "91 234 567" },
  { code: "PY", name: "Paraguai", dial: "595", flag: "🇵🇾", maskPlaceholder: "981 123 456" },
  { code: "MX", name: "México", dial: "52", flag: "🇲🇽", maskPlaceholder: "55 1234 5678" },
  { code: "CO", name: "Colômbia", dial: "57", flag: "🇨🇴", maskPlaceholder: "300 123 4567" },
  { code: "IE", name: "Irlanda", dial: "353", flag: "🇮🇪", maskPlaceholder: "85 123 4567" },
  { code: "NL", name: "Holanda", dial: "31", flag: "🇳🇱", maskPlaceholder: "6 12345678" },
  { code: "JP", name: "Japão", dial: "81", flag: "🇯🇵", maskPlaceholder: "90-1234-5678" }
];

export function normalizePhone(raw: string, countryDial: string = "55"): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;

  // Se o usuário já digitou incluindo o DDI (ex: 5511999999999 ou 15551234567)
  if (countryDial === "55") {
    let d = digits;
    if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
      d = d.slice(2);
    }
    // Brasil padrão: 10 ou 11 dígitos
    if (d.length === 10 || d.length === 11) {
      return `55${d}`;
    }
    // Se digitou direto o número completo válido
    if (d.length >= 8 && d.length <= 15) {
      return `55${d}`;
    }
    return null;
  }

  // Outros países: se já começou com o dial, não duplica
  let cleaned = digits;
  if (cleaned.startsWith(countryDial) && cleaned.length > countryDial.length + 5) {
    return cleaned;
  }
  
  if (cleaned.length < 5 || cleaned.length > 15) return null;
  return `${countryDial}${cleaned}`;
}

export function formatPhone(fullDigits: string): string {
  if (!fullDigits) return "";
  const d = fullDigits.replace(/\D/g, "");

  // Se for Brasil
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const local = d.slice(2);
    if (local.length === 11) {
      return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
    return `+55 (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }

  // Outros números internacionais
  if (d.length >= 7) {
    return `+${d}`;
  }
  return fullDigits;
}

// Mantido para compatibilidade com chamadas existentes
export const normalizePhoneBR = (raw: string) => normalizePhone(raw, "55");
export const formatPhoneBR = (raw: string) => formatPhone(raw);
