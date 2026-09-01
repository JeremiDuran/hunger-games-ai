/**
 * Hunger Games AI — Narrative Storytelling API Route Handler
 * Next.js 16 App Router POST endpoint for OpenRouter LLM streaming.
 */

import { NextRequest, NextResponse } from "next/server";
import { narrativeRequestSchema } from "@/lib/schemas/narrative";
import { streamNarrative, generateBarebonesFallback } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json();
    const parseResult = narrativeRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid narrative event payload",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;
    const apiKey = process.env.OPENROUTER_API_KEY;

    // Gracefully handle missing API key by serving barebones fallback immediately
    if (!apiKey) {
      const fallbackText = generateBarebonesFallback(payload);
      return new Response(fallbackText, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Narrative-Source": "fallback-no-key",
        },
      });
    }

    const streamResult = streamNarrative(payload, { apiKey });
    return streamResult.toTextStreamResponse({
      headers: {
        "X-Narrative-Source": "openrouter",
      },
    });
  } catch (error) {
    console.error("[api/narrative] Streaming error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate narrative stream",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
