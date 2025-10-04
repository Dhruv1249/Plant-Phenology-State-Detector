import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// --- NEW: Separate cache for biome summaries ---
const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'biome-summaries.json');

interface BiomeData {
  biome: string;
  biome_name: string;
  climate_data: { temperature: number; precipitation: number; radiation: number };
  species: { common_name: string }[];
  pests: { common_name_pest: string }[];
}
type BatchRequestPayload = BiomeData[];

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

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
        const requestData: BatchRequestPayload = await req.json();
        const cache = await readCache();
        const finalSummaries: Record<string, string> = {};
        
        const biomesToFetch = requestData.filter(biome => !cache[biome.biome]?.summary);

        for (const biome of requestData) {
            if (cache[biome.biome]?.summary) {
                finalSummaries[biome.biome] = cache[biome.biome].summary;
            }
        }

        if (biomesToFetch.length === 0) {
            return NextResponse.json({ summaries: finalSummaries, model: 'cache' });
        }

        if (!apiKey) {
            // Handle no API key case
            for (const biome of biomesToFetch) {
                 const fallback = `The ${biome.biome_name} biome is characterized by its distinct climate patterns. It supports a variety of plant species, including ${biome.species.slice(0, 2).map(s => s.common_name).join(', ')}, and is home to pests such as ${biome.pests.slice(0, 1).map(p => p.common_name_pest).join('')}.`;
                 finalSummaries[biome.biome] = fallback;
                 cache[biome.biome] = { summary: fallback, modelUsed: 'fallback/no-key' };
            }
            await writeCache(cache);
            return NextResponse.json({ summaries: finalSummaries, model: 'fallback/no-key' });
        }
        
        const prompt = `
You are a scientific writer for a botanical field guide. Your task is to generate extremely concise, data-rich summaries for the provided biomes, plant, pest species and rest of the factors . Brevity and factual accuracy are the highest priorities.

Follow these rules strictly:
1.  **Length Constraint:** Each summary MUST be 3-6 sentences long.
2.  **Content Requirement:** Each summary MUST be tailored to the provided environmental context (biome name, climate data). Concisely describe overall biomes what plants and pests are there and about and about rest of the things. Always keep a bit of  variation in sentences for each biomes no two sentences should sound same.
3.  **Tone:** The writing style must be dense, factual, and encyclopedic. Do not use conversational language or speculative information. Never use scientific names.
4.  **Output Format:** Your ENTIRE response MUST be a single, valid JSON object. The keys of the object MUST be the biome codes (e.g., "Cfa"), and the values MUST be the generated summary strings.

YOUR RESPONSE MUST ALWAYS BE A VALID JSON OBJECT YOU CANNOT DISOBEY THIS RULE
Here is the data for the biome summaries you need to generate:
${JSON.stringify(biomesToFetch, null, 2)}
`.trim();

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        const maybeJson = await resp.json();
        const text = maybeJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();
        const newSummaries = JSON.parse(cleanedText);
        console.log(newSummaries)
        Object.assign(finalSummaries, newSummaries);

        for (const biomeCode in newSummaries) {
            cache[biomeCode] = { summary: newSummaries[biomeCode], modelUsed: 'gemini-2.5-flash-lite' };
        }
        await writeCache(cache);

        return NextResponse.json({ summaries: finalSummaries });

    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Unknown server error' }, { status: 500 });
    }
}