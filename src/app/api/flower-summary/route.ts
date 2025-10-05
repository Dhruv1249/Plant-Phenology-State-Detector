import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const CACHE_DIR = path.join('/tmp');
const CACHE_FILE = path.join(CACHE_DIR, 'flower-summaries.json');

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

function makeKey(scientific_name?: string, common_name?: string, biome_name?: string) {
    const name = (scientific_name || common_name || 'unknown').trim().toLowerCase();
    const biome = (biome_name || 'unknown').trim().toLowerCase();
    return `${name}::${biome}`;
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
        const { scientific_name, common_name, biome_name } = await req.json();

        const key = makeKey(scientific_name, common_name, biome_name);
        let cache = await readCache();

        if (cache[key]?.summary) {
            return NextResponse.json({ summary: cache[key].summary, cached: true });
        }

        if (!apiKey) {
            const namePart = scientific_name || common_name || 'This plant';
            const fallback = `${namePart} is well-adapted to the conditions of the ${biome_name} biome.`;
            cache[key] = { summary: fallback, modelUsed: 'fallback/no-key' };
            await writeCache(cache);
            return NextResponse.json({ summary: fallback });
        }

        const prompt = `
You are a scientific writer for a botanical field guide. Your task is to generate an extremely concise, data-rich summary for the provided plant species. Brevity and factual accuracy are the highest priorities.

Follow these rules with absolute precision:
1.  **Complete Iteration:** For the single biome provided, generate a summary for the single species provided.
2.  **Complete JSON Output:** Your entire response MUST be a single, valid JSON object with a single key "summary" and the value as the summary string.
3.  **Summary Content:** For each summary, concisely describe the plant's general appearance, its seasonal cycle (like flowering time) in its specific biome, and its primary ecological role.
4.  **Summary Style:** Each summary must be 2-3 sentences and 40-60 words. The tone must be dense, factual, and encyclopedic.

Here is the data you MUST process in its entirety:
${JSON.stringify({ scientific_name, common_name, biome_name }, null, 2)}
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
        const newSummary = JSON.parse(cleanedText).summary;

        cache[key] = {
            summary: newSummary,
            scientific_name,
            common_name,
            biome_name,
            modelUsed: 'gemini-2.5-flash-lite',
            generatedAt: new Date().toISOString(),
        };
        await writeCache(cache);

        return NextResponse.json({ summary: newSummary });

    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Unknown server error' }, { status: 500 });
    }
}