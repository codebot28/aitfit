import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

// Vervangt Base44's `integrations.Core.InvokeLLM`. Zelfde aanroep-vorm:
//   invokeLLM({ prompt, response_json_schema?, file_urls?, model? })
// Geeft het JSON-object terug als er een schema is, anders de tekst.
type InvokeArgs = {
  prompt: string;
  response_json_schema?: Record<string, unknown>;
  file_urls?: string[];
  model?: string;
  max_tokens?: number;
};

// Base44-modelnamen -> echte Anthropic-model-ids.
const MODEL_MAP: Record<string, string> = {
  claude_sonnet_4_6: 'claude-sonnet-4-6',
  claude_opus_4_8: 'claude-opus-4-8',
  claude_haiku_4_5: 'claude-haiku-4-5-20251001',
};
function mapModel(m?: string): string {
  if (!m) return 'claude-sonnet-4-6';
  return MODEL_MAP[m] ?? m;
}

export async function invokeLLM(args: InvokeArgs): Promise<unknown> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY ontbreekt (zet hem als Supabase secret)');

  const content: unknown[] = [];

  // Afbeeldingen (bijv. een kledingfoto) als base64 meesturen voor vision.
  if (Array.isArray(args.file_urls)) {
    for (const url of args.file_urls) {
      const res = await fetch(url);
      if (!res.ok) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const mediaType = res.headers.get('content-type') || 'image/jpeg';
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: encodeBase64(bytes) },
      });
    }
  }
  content.push({ type: 'text', text: args.prompt });

  const body: Record<string, unknown> = {
    model: mapModel(args.model),
    max_tokens: args.max_tokens ?? 2048,
    messages: [{ role: 'user', content }],
  };

  // Met schema: forceer een tool-call zodat we gegarandeerd geldige JSON krijgen.
  if (args.response_json_schema) {
    body.tools = [{
      name: 'respond',
      description: 'Geef je antwoord in exact dit JSON-formaat.',
      input_schema: args.response_json_schema,
    }];
    body.tool_choice = { type: 'tool', name: 'respond' };
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
  }
  const data = await resp.json();

  if (args.response_json_schema) {
    const toolUse = (data.content || []).find((c: { type: string }) => c.type === 'tool_use');
    return toolUse?.input ?? {};
  }
  const textBlock = (data.content || []).find((c: { type: string }) => c.type === 'text');
  return textBlock?.text ?? '';
}
