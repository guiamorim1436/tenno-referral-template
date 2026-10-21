import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept-profile, content-profile",
};

function generateCodigo(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < len; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
  return r;
}

function generateMagicToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePhoneIntl(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  // Número internacional aceitável: entre 8 e 15 dígitos
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

// ---- Kommo helpers ----
type KommoConfig = { subdomain: string; bearer_token: string; pipeline_id: number | null; stage_id: number | null };
const kommoHeaders = (c: KommoConfig) => ({
  Authorization: `Bearer ${c.bearer_token}`,
  "Content-Type": "application/json",
});
const kommoUrl = (c: KommoConfig) => `https://${c.subdomain}.kommo.com/api/v4`;

async function findContactByPhone(c: KommoConfig, phone: string) {
  const res = await fetch(`${kommoUrl(c)}/contacts?query=${encodeURIComponent(phone)}&limit=10`, { headers: kommoHeaders(c) });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Kommo find ${res.status}`);
  const data = await res.json();
  const contacts = data?._embedded?.contacts ?? [];
  return contacts[0]?.id ?? null;
}

async function createContact(c: KommoConfig, contact: { nome: string; telefone: string }) {
  const body = [{
    name: contact.nome,
    custom_fields_values: [{ field_code: "PHONE", values: [{ value: contact.telefone, enum_code: "WORK" }] }],
  }];
  const res = await fetch(`${kommoUrl(c)}/contacts`, {
    method: "POST",
    headers: kommoHeaders(c),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Kommo contact ${res.status}`);
  const data = await res.json();
  return data?._embedded?.contacts?.[0]?.id ?? null;
}

async function createLead(c: KommoConfig, lead: { nome: string; contactId?: number | null; tags?: string[] }) {
  const item: any = {
    name: `Indicação: ${lead.nome}`,
    status_id: lead.tags ? undefined : c.stage_id,
    pipeline_id: c.pipeline_id,
  };
  if (c.pipeline_id) item.pipeline_id = c.pipeline_id;
  if (c.stage_id) item.status_id = c.stage_id;
  if (lead.contactId) item._embedded = { contacts: [{ id: lead.contactId }] };
  if (lead.tags?.length) item._embedded = { ...(item._embedded ?? {}), tags: lead.tags.map((t) => ({ name: t })) };
  const res = await fetch(`${kommoUrl(c)}/leads`, {
    method: "POST",
    headers: kommoHeaders(c),
    body: JSON.stringify([item]),
  });
  if (!res.ok) throw new Error(`Kommo lead ${res.status}`);
  const data = await res.json();
  return data?._embedded?.leads?.[0]?.id ?? null;
}

async function addLeadNote(c: KommoConfig, leadId: number, text: string) {
  await fetch(`${kommoUrl(c)}/leads/${leadId}/notes`, {
    method: "POST",
    headers: kommoHeaders(c),
    body: JSON.stringify([{ note_type: "common", params: { text } }]),
  });
}

// ---- Dispatcher ----
async function handle(action: string, payload: any, admin: any) {
  switch (action) {
    case "getPublicConfig": {
      const { data } = await admin
        .from("configuracoes_kommo")
        .select("nome_plataforma, logo_url, whatsapp_clinica, whatsapp_mensagem")
        .eq("id", 1)
        .maybeSingle();
      return data;
    }
    case "cadastrarIndicador": {
      const nome = String(payload.nome || "").trim();
      const telefone = normalizePhoneIntl(payload.telefone || "");
      if (nome.length < 2) throw new Error("Nome inválido.");
      if (!telefone) throw new Error("Telefone inválido.");

      const { data: existing } = await admin
        .from("indicadores")
        .select("id, nome, codigo_indicacao")
        .eq("telefone", telefone)
        .maybeSingle();
      if (existing) {
        const magic = generateMagicToken();
        await admin.from("indicadores").update({ magic_token: magic }).eq("id", existing.id);
        return { magic_token: magic, codigo: existing.codigo_indicacao, novo: false };
      }
      let codigo = "";
      for (let i = 0; i < 5; i++) {
        codigo = generateCodigo(6);
        const { data: dup } = await admin
          .from("indicadores").select("id").eq("codigo_indicacao", codigo).maybeSingle();
        if (!dup) break;
      }
      const magic = generateMagicToken();
      const { data: created, error } = await admin
        .from("indicadores")
        .insert({ nome, telefone, codigo_indicacao: codigo, magic_token: magic })
        .select("id, codigo_indicacao")
        .single();
      if (error) throw new Error(error.message);
      return { magic_token: magic, codigo: created.codigo_indicacao, novo: true };
    }
    case "entrarPorTelefone": {
      const telefone = normalizePhoneIntl(payload.telefone || "");
      if (!telefone) throw new Error("Telefone inválido.");
      const { data: ind } = await admin
        .from("indicadores").select("id").eq("telefone", telefone).maybeSingle();
      if (!ind) throw new Error("Não encontramos esse telefone. Faça seu cadastro.");
      const magic = generateMagicToken();
      await admin.from("indicadores").update({ magic_token: magic }).eq("id", ind.id);
      return { magic_token: magic };
    }
    case "getPainel": {
      const token = String(payload.token || "");
      const { data: ind } = await admin
        .from("indicadores")
        .select("id, nome, codigo_indicacao, telefone, created_at")
        .eq("magic_token", token)
        .maybeSingle();
      if (!ind) throw new Error("Link inválido ou expirado.");
      const { data: indicacoes } = await admin
        .from("indicacoes")
        .select("id, nome_indicado, status, created_at")
        .eq("indicador_id", ind.id)
        .order("created_at", { ascending: false });
      return { indicador: ind, indicacoes: indicacoes ?? [] };
    }
    case "getIndicadorPorCodigo": {
      const codigo = String(payload.codigo || "").toUpperCase();
      const { data: ind } = await admin
        .from("indicadores").select("id, nome").eq("codigo_indicacao", codigo).maybeSingle();
      if (!ind) throw new Error("Link de indicação não encontrado.");
      if (payload.registrarClique) {
        await admin.from("cliques_link").insert({ indicador_id: ind.id, user_agent: payload.userAgent ?? null });
      }
      return { id: ind.id, nome: ind.nome };
    }
    case "submitIndicacao": {
      const nome = String(payload.nome || "").trim();
      const telefone = normalizePhoneIntl(payload.telefone || "");
      const codigo = String(payload.codigo || "").toUpperCase();
      if (nome.length < 2) throw new Error("Nome inválido.");
      if (!telefone) throw new Error("Telefone inválido.");

      const { data: indicador } = await admin
        .from("indicadores").select("id, nome, telefone").eq("codigo_indicacao", codigo).maybeSingle();
      if (!indicador) throw new Error("Link de indicação inválido.");
      if (indicador.telefone === telefone) throw new Error("Você não pode se indicar para si mesmo.");

      const { data: config } = await admin
        .from("configuracoes_kommo")
        .select("whatsapp_clinica, whatsapp_mensagem, subdomain, bearer_token, pipeline_id, stage_id")
        .eq("id", 1).maybeSingle();

      let whatsappUrl: string | null = null;
      if (config?.whatsapp_clinica) {
        const clean = config.whatsapp_clinica.replace(/\D/g, "");
        const msg = (config.whatsapp_mensagem || "Olá, gostaria de saber mais sobre a clínica.")
          .replace("[Indicador]", indicador.nome.split(" ")[0]);
        whatsappUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
      }

      const { data: dup } = await admin
        .from("indicacoes").select("id")
        .eq("indicador_id", indicador.id).eq("telefone_indicado", telefone).maybeSingle();
      if (dup) return { ok: true, duplicado: true, whatsappUrl };

      let kommo_contact_id: number | null = null;
      let kommo_lead_id: number | null = null;
      let kommo_erro: string | null = null;
      if (config?.subdomain && config?.bearer_token) {
        const cfg: KommoConfig = {
          subdomain: config.subdomain,
          bearer_token: config.bearer_token,
          pipeline_id: config.pipeline_id,
          stage_id: config.stage_id,
        };
        try {
          const existing = await findContactByPhone(cfg, telefone);
          kommo_contact_id = existing ?? (await createContact(cfg, { nome, telefone }));
          kommo_lead_id = await createLead(cfg, { nome, contactId: kommo_contact_id, tags: ["Indicação"] });
          await addLeadNote(cfg, kommo_lead_id,
            `Origem: Indicação\nIndicador: ${indicador.nome} (${indicador.telefone})\nCódigo: ${codigo}`);
        } catch (e) {
          kommo_erro = (e as Error).message;
          console.error("Kommo error:", kommo_erro);
        }
      }

      const { error } = await admin.from("indicacoes").insert({
        indicador_id: indicador.id,
        nome_indicado: nome,
        telefone_indicado: telefone,
        status: "recebido",
        kommo_contact_id,
        kommo_lead_id,
        observacao: kommo_erro ? `Erro Kommo: ${kommo_erro}` : null,
      });
      if (error) throw new Error(error.message);
      return { ok: true, duplicado: false, whatsappUrl };
    }
    default:
      throw new Error(`Ação desconhecida: ${action}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { action, payload, schema } = await req.json();

    // Data client — uses tenant schema if provided
    const dbSchema = schema && schema !== "public" ? schema : undefined;
    const clientOpts: any = {};
    if (dbSchema) clientOpts.db = { schema: dbSchema };
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey,
      clientOpts,
    );

    const result = await handle(action, payload ?? {}, admin);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
