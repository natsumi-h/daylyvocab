import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface WordInput {
  word: string;
  meaning: string;
  tags: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { words }: { words: WordInput[] } = await req.json();

    const wordList = words
      .map(
        (w, i) =>
          `${i + 1}. word="${w.word}" meaning="${w.meaning || ''}" tags="${w.tags.join(',') || 'none'}"`
      )
      .join('\n');

    const prompt = `You are an English vocabulary coach for a Japanese professional (Solutions Engineer, tech company, Singapore).

Generate learning content for each word below. Return ONLY a raw JSON array (no markdown, no backticks).

CRITICAL: Never use double-quote characters (") inside any string value. Rephrase sentences to avoid quoted speech.

Each element:
{
  "word": "<original word>",
  "japanese_meaning": "<自然な日本語訳 1〜2語>",
  "example_en": "<1 natural example sentence, no double quotes inside>",
  "example_ja": "<その日本語訳>",
  "similar": [
    {"expr": "...", "note": "<日本語1行メモ>"},
    {"expr": "...", "note": "<日本語1行メモ>"},
    {"expr": "...", "note": "<日本語1行メモ>"}
  ],
  "tip": "<使い方ヒント 日本語1行>"
}

Tag rules for example sentences:
- Work → professional context (meetings, Slack, client calls, specs)
- Daily → casual everyday conversation
- Work+Daily → one sentence covering both
- none → natural context of your choice

Words:
${wordList}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const clean = raw.replace(/```json|```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('JSONの配列が見つかりませんでした');

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      parsed = JSON.parse(jsonrepair(match[0]));
    }

    return NextResponse.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
