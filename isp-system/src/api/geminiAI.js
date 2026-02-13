const GEMINI_API_KEY = 'AIzaSyDI74IZBKKe6P5GqSfqULmlcKE7leMQVKk';

const MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
];

const TONES = {
  formal: { label: 'Formal', emoji: '👔', desc: 'Tono profesional y corporativo' },
  amigable: { label: 'Amigable', emoji: '😊', desc: 'Tono cercano y cálido' },
  urgente: { label: 'Urgente', emoji: '⚡', desc: 'Tono directo y con sentido de urgencia' },
  persuasivo: { label: 'Persuasivo', emoji: '🎯', desc: 'Tono convincente para cobranza' },
};

export { TONES };

export async function rewriteWithAI(text, tone, clientContext = '') {
  if (!text) throw new Error('No hay texto para reescribir');

  const prompt = `Actúa como un asistente experto de soporte técnico y cobranzas para un ISP (Proveedor de Internet).
Tu tarea es reescribir el siguiente mensaje usando un tono: ${tone.toUpperCase()}.

${clientContext ? `Contexto del Cliente: ${clientContext}.` : ''}
Mensaje original: "${text}"

Reglas:
1. Mantén las variables importantes (montos, fechas) si existen en el original.
2. Sé conciso, profesional y usa buena ortografía.
3. IMPORTANTE: Solo devuelve el texto del mensaje reescrito, sin comillas, sin introducciones ni explicaciones.`;

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (response.status === 404) continue;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Error ${response.status}`);
      }

      const data = await response.json();
      if (data.candidates?.[0]?.content) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn(`Modelo ${model} falló:`, err);
    }
  }

  throw new Error('No se pudo conectar con la IA. Verifica tu API Key y conexión.');
}
