import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { provider, key } = body;

    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_KEY",
            message: "API key is required to validate.",
          },
        },
        { status: 400 }
      );
    }

    const trimmedKey = key.trim();

    // 1. YouTube Data API v3 validation probe
    if (provider === "youtube") {
      try {
        const probeRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${encodeURIComponent(
            trimmedKey
          )}`
        );
        const data = await probeRes.json();

        if (probeRes.ok && data.kind === "youtube#channelListResponse") {
          return NextResponse.json({
            success: true,
            valid: true,
            provider: "youtube",
            message: "✓ YouTube Data API v3 key is verified and active! Quota is operational.",
          });
        }

        const errMsg =
          data.error?.message ||
          "Google Cloud rejected this API key. Verify that 'YouTube Data API v3' is enabled in Google Cloud Console.";

        return NextResponse.json({
          success: false,
          valid: false,
          provider: "youtube",
          error: {
            code: "INVALID_YOUTUBE_KEY",
            message: errMsg,
          },
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          valid: false,
          provider: "youtube",
          error: {
            code: "PROBE_NETWORK_ERROR",
            message: err?.message || "Failed to contact Google Cloud API servers.",
          },
        });
      }
    }

    // 2. Google Gemini API validation probe
    if (provider === "gemini") {
      try {
        const probeRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${encodeURIComponent(
            trimmedKey
          )}`
        );
        const data = await probeRes.json();

        if (probeRes.ok && data.name) {
          return NextResponse.json({
            success: true,
            valid: true,
            provider: "gemini",
            message: "✓ Google Gemini API key is valid and model gemini-1.5-flash is accessible.",
          });
        }

        return NextResponse.json({
          success: false,
          valid: false,
          provider: "gemini",
          error: {
            code: "INVALID_GEMINI_KEY",
            message: data.error?.message || "Invalid Gemini API key.",
          },
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          valid: false,
          provider: "gemini",
          error: {
            code: "PROBE_NETWORK_ERROR",
            message: err?.message || "Failed to connect to Google Generative Language API.",
          },
        });
      }
    }

    // 3. OpenAI API validation probe
    if (provider === "openai") {
      try {
        const probeRes = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${trimmedKey}`,
          },
        });
        const data = await probeRes.json();

        if (probeRes.ok && Array.isArray(data.data)) {
          return NextResponse.json({
            success: true,
            valid: true,
            provider: "openai",
            message: "✓ OpenAI API key verified and operational.",
          });
        }

        return NextResponse.json({
          success: false,
          valid: false,
          provider: "openai",
          error: {
            code: "INVALID_OPENAI_KEY",
            message: data.error?.message || "Invalid OpenAI API key.",
          },
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          valid: false,
          provider: "openai",
          error: {
            code: "PROBE_NETWORK_ERROR",
            message: err?.message || "Failed to connect to OpenAI API servers.",
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNSUPPORTED_PROVIDER",
          message: `Provider '${provider}' is not supported. Use 'youtube', 'gemini', or 'openai'.`,
        },
      },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Key validation failed.",
        },
      },
      { status: 500 }
    );
  }
}
