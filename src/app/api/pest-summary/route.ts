import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const CACHE_DIR = path.join('/tmp');
const CACHE_FILE = path.join(CACHE_DIR, 'pest-summaries.json');

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

function makeKey(pest_name?: string, biome_name?: string) {
    const name = (pest_name || 'unknown').trim().toLowerCase();
    const biome = (biome_name || 'unknown').trim().toLowerCase();
    return `${name}::${biome}`;
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
        const { pest_name, biome_name } = await req.json();

        if (!pest_name || !biome_name) {
            return NextResponse.json({ error: 'Missing pest_name or biome_name' }, { status: 400 });
        }

        const key = makeKey(pest_name, biome_name);
        let cache = await readCache();

        if (cache[key]?.summary) {
            return NextResponse.json({ summary: cache[key].summary, cached: true });
        }

        if (!apiKey) {
            const fallback = `${pest_name} is a known pest in the ${biome_name} biome. Control methods should be considered based on local guidelines.`;
            cache[key] = { summary: fallback, modelUsed: 'fallback/no-key' };
            await writeCache(cache);
            return NextResponse.json({ summary: fallback });
        }

        const prompt = `
You are an entomologist providing a concise summary of an agricultural or ecological pest.

Follow these rules:
1.  **Content:** Describe the pest named "${pest_name}". Explain its impact on the local ecosystem or agriculture within the "${biome_name}" biome. Mention its typical life cycle or period of activity.
2.  **Style:** Keep the summary to 2-4 sentences. The tone should be factual and informative.
3.  **Output:** Respond ONLY with a single, valid JSON object formatted like this: { "summary": "Your generated text here." }

Do not include markdown, comments, or any other text outside the JSON object.`.trim();

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!resp.ok) {
            throw new Error(`API Error: ${await resp.text()}`);
        }
        
        const maybeJson = await resp.json();
        const text = maybeJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        let newSummary;
        try {
            const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();
            const parsed = JSON.parse(cleanedText);
            if (typeof parsed.summary !== 'string') {
                throw new Error("AI response JSON is missing the 'summary' string key.");
            }
            newSummary = parsed.summary;
        } catch(e) {
            console.error("Failed to parse AI response for pest summary:", text);
            throw new Error("AI returned a malformed response.");
        }


        cache[key] = {
            summary: newSummary,
            pest_name,
            biome_name,
            modelUsed: 'gemini-2.5-flash-lite',
            generatedAt: new Date().toISOString(),
        };
        await writeCache(cache);

        return NextResponse.json({ summary: newSummary });

    } catch (e: any) {
        console.error("Pest summary error:", e.message);
        return NextResponse.json({ error: e?.message || 'Unknown server error' }, { status: 500 });
    }
}