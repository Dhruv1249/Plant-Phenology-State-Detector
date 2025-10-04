import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force Node.js runtime for full fetch + fs compatibility
export const runtime = 'nodejs';

// Where we persist summaries on the server
const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'flower-summaries.json');

// --- NEW: Type definition for the incoming batch request ---
interface Species {
  scientific_name: string;
  common_name: string;
}
interface BiomeData {
  biome: string; // e.g., "Cfa"
  biome_name: string;
  climate_data: { temperature: number; precipitation: number; radiation: number };
  species: Species[];
  pests: any[]; // Pest data can be included as context
}
type BatchRequestPayload = BiomeData[];


// Read cache JSON from disk (create empty if absent)
async function readCache(): Promise<Record<string, any>> {
  try {
    const buf = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(buf || '{}');
  } catch (e: any) {
    if (e?.code === 'ENOENT') return {};
    throw e;
  }
}

async function writeCache(obj: Record<string, any>) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// MODIFIED: Use the biome CODE for a more unique key
function makeKey(scientific_name?: string, common_name?: string, biome_code?: string) {
  const name = (scientific_name || common_name || 'unknown').trim().toLowerCase();
  const biome = (biome_code || 'unknown').trim().toLowerCase();
  return `${name}::${biome}`;
}

// ### CORE LOGIC HAS BEEN REWRITTEN FOR BATCHING ###
export async function POST(req: Request) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY;

    const requestData: BatchRequestPayload = await req.json();
    const cache = await readCache();
    const finalSummaries: Record<string, string> = {};

    // --- 1. Filter out cached results and prepare data for Gemini ---
    const biomesToFetch = [];
    // Map to easily find original data later for caching
    const keyToDataMap = new Map<string, { species: Species; biome: BiomeData }>();

    for (const biome of requestData) {
      const speciesToFetch = [];
      for (const species of biome.species) {
        const key = makeKey(species.scientific_name, species.common_name, biome.biome);
        keyToDataMap.set(key, { species, biome });

        if (cache[key]?.summary) {
          finalSummaries[key] = cache[key].summary;
        } else {
          speciesToFetch.push(species);
        }
      }
      // Only add biome to the fetch list if it has species that need summaries
      if (speciesToFetch.length > 0) {
        biomesToFetch.push({ ...biome, species: speciesToFetch });
      }
    }

    // If everything was in the cache, return immediately
    if (biomesToFetch.length === 0) {
      return NextResponse.json({ summaries: finalSummaries, model: 'cache' });
    }

    // --- 2. Handle the "No API Key" scenario gracefully ---
    if (!apiKey) {
      for (const biome of biomesToFetch) {
        for (const species of biome.species) {
          const key = makeKey(species.scientific_name, species.common_name, biome.biome);
          const namePart = species.common_name || species.scientific_name || 'This plant';
          const fallback = `${namePart} is documented in the ${biome.biome_name} biome, where it adapts to local conditions.`;
          finalSummaries[key] = fallback;
          // Persist fallback to cache
          cache[key] = {
            summary: fallback,
            scientific_name: species.scientific_name,
            common_name: species.common_name,
            biome_name: biome.biome_name,
            modelUsed: 'fallback/no-key',
            generatedAt: new Date().toISOString(),
          };
        }
      }
      await writeCache(cache);
      return NextResponse.json({ summaries: finalSummaries, model: 'fallback/no-key' });
    }

    // --- 3. Construct the batch prompt for Gemini ---
    // --- 3. Construct the batch prompt for Gemini ---
  const prompt = `
You are a scientific writer for a botanical field guide. Your task is to generate extremely concise, data-rich summaries for the provided biomes, plant, pest species and rest of the factors . Brevity and factual accuracy are the highest priorities.

Follow these rules strictly:
1.  **Length Constraint:** Each summary MUST be 3-6 sentences long.
2.  **Content Requirement:** Each summary MUST be tailored to the provided environmental context (biome name, climate data). Concisely describe overall biomes what plants and pests are there and about and about rest of the things. Always keep a bit of  variation in sentences for each biomes no two sentences should sound same.
3.  **Tone:** The writing style must be dense, factual, and encyclopedic. Do not use conversational language or speculative information. Never use scientific names.
4.  **Output Format:** Your entire response MUST be a single, valid JSON object. Do not include any explanatory text, markdown, or any characters outside of the final JSON structure. The JSON object must be a map where each key is 'SCIENTIFIC_NAME::BIOME_CODE' and the value is the summary string.

Here is the data for the summaries you need to generate:
${JSON.stringify(biomesToFetch, null, 2)}
`.trim();

    const buildBody = () => ({ contents: [{ parts: [{ text: prompt }] }] });
    const models = ['gemini-2.5-flash-lite'];
    let lastError: string | null = null;
    let modelUsed: string | null = null;
    let newSummaries: Record<string, string> | null = null;
    console.log('PROMPT SENT TO GEMINI:', prompt);
    // --- 4. Call the Gemini API ---
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody()),
        });

        const maybeJson = await safeJson(resp);
        if (!resp.ok) {
          lastError = formatError(maybeJson) || (await resp.text());
          continue; // Try next model
        }

        const text = maybeJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // The response might be wrapped in markdown, so we clean it
        const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();

        if (cleanedText) {
          try {
            newSummaries = JSON.parse(cleanedText);
            modelUsed = model;
            break; // Success! Exit the loop.
          } catch (e) {
            lastError = `Failed to parse JSON response from model: ${e instanceof Error ? e.message : String(e)}. Response text: "${cleanedText}"`;
            continue; // Malformed JSON, try next model
          }
        } else {
          lastError = 'Empty response from Gemini';
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    // --- 5. Process the response, cache it, and return ---
    if (newSummaries && modelUsed) {
      Object.assign(finalSummaries, newSummaries);
      // Update cache with new summaries
      for (const key in newSummaries) {
        const data = keyToDataMap.get(key);
        if (data) {
          cache[key] = {
            summary: newSummaries[key],
            scientific_name: data.species.scientific_name,
            common_name: data.species.common_name,
            biome_name: data.biome.biome_name,
            modelUsed: modelUsed,
            generatedAt: new Date().toISOString(),
          };
        }
      }
      await writeCache(cache);
      return NextResponse.json({ summaries: finalSummaries, model: modelUsed });
    }

    // --- 6. Handle failure of all Gemini calls ---
    // If we reach here, all model calls failed. Generate local fallbacks.
    for (const biome of biomesToFetch) {
        for (const species of biome.species) {
            const key = makeKey(species.scientific_name, species.common_name, biome.biome);
            const namePart = species.common_name || species.scientific_name || 'This plant';
            const fallback = `${namePart} is a species found in the ${biome.biome_name} biome. Its specific characteristics depend on local climate and soil conditions.`;
            finalSummaries[key] = fallback;
            cache[key] = {
                summary: fallback,
                scientific_name: species.scientific_name,
                common_name: species.common_name,
                biome_name: biome.biome_name,
                modelUsed: 'fallback/generator-failed',
                generatedAt: new Date().toISOString(),
            };
        }
    }
    await writeCache(cache);
    return NextResponse.json({ summaries: finalSummaries, model: 'fallback/generator-failed', error: lastError });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown server error' }, { status: 500 });
  }
}

async function safeJson(resp: Response) {
  try { return await resp.json(); } catch { return null as any; }
}

function formatError(j: any) {
  try {
    const m = j?.error?.message || j?.candidates?.[0]?.finishReason || j?.status || '';
    return typeof m === 'string' ? m : JSON.stringify(j);
  } catch { return null; }
}