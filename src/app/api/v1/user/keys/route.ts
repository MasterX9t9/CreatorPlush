import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { userKeysRepository } from "@/lib/repositories/user-keys-repository";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.user.id || "usr_default";

    const keys = await userKeysRepository.getUserKeys(userId);
    const hasPlatformYouTube = !!process.env.YOUTUBE_API_KEY;
    const hasPlatformGemini = !!process.env.GEMINI_API_KEY;

    return NextResponse.json({
      success: true,
      data: {
        keys,
        platformDefaults: {
          hasYouTube: hasPlatformYouTube,
          hasGemini: hasPlatformGemini,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to retrieve user keys",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.user.id || "usr_default";

    const body = await request.json().catch(() => ({}));
    const { provider, key } = body;

    if (!provider || !["youtube", "gemini", "openai"].includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PROVIDER",
            message: "Provider must be 'youtube', 'gemini', or 'openai'.",
          },
        },
        { status: 400 }
      );
    }

    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_KEY",
            message: "Key string is required.",
          },
        },
        { status: 400 }
      );
    }

    const trimmed = key.trim();

    // Validate the key with probe first
    if (provider === "youtube") {
      const probeRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${encodeURIComponent(
          trimmed
        )}`
      );
      const probeData = await probeRes.json();
      if (!probeRes.ok || probeData.kind !== "youtube#channelListResponse") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_API_KEY",
              message:
                probeData.error?.message ||
                "Failed to validate YouTube API key with Google Cloud. Ensure YouTube Data API v3 is enabled.",
            },
          },
          { status: 400 }
        );
      }
    } else if (provider === "gemini") {
      const probeRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${encodeURIComponent(
          trimmed
        )}`
      );
      if (!probeRes.ok) {
        const probeData = await probeRes.json();
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_API_KEY",
              message: probeData.error?.message || "Invalid Google Gemini API key.",
            },
          },
          { status: 400 }
        );
      }
    }

    // Key is verified! Encrypt and save
    const saved = await userKeysRepository.saveKey(userId, provider, trimmed, true);

    return NextResponse.json({
      success: true,
      data: saved,
      message: `Your personal ${provider.toUpperCase()} API key has been securely saved and activated.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SAVE_ERROR",
          message: error?.message || "Failed to save key.",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.user.id || "usr_default";

    const body = await request.json().catch(() => ({}));
    const { provider } = body;

    if (!provider || !["youtube", "gemini", "openai"].includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PROVIDER",
            message: "Provider must be 'youtube', 'gemini', or 'openai'.",
          },
        },
        { status: 400 }
      );
    }

    await userKeysRepository.removeKey(userId, provider);

    return NextResponse.json({
      success: true,
      message: `Personal ${provider.toUpperCase()} API key removed. Reverted to platform default.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DELETE_ERROR",
          message: error?.message || "Failed to remove key.",
        },
      },
      { status: 500 }
    );
  }
}
