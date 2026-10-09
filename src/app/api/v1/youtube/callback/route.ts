import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/youtube?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings/youtube?error=missing_auth_code", request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/v1/youtube/callback";

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch authorized channel profile
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const channelRes = await youtube.channels.list({
      part: ["snippet", "statistics"],
      mine: true,
    });

    const channelItem = channelRes.data.items?.[0];
    if (!channelItem || !channelItem.id) {
      return NextResponse.redirect(
        new URL(
          "/settings/youtube?error=no_channel_found_for_account",
          request.url
        )
      );
    }

    // Encrypt sensitive tokens using AES-256-GCM (Rule 13 in AGENTS.md)
    const encryptedAccess = encryptToken(tokens.access_token || "");
    const encryptedRefresh = encryptToken(tokens.refresh_token || "");

    // Find or create default workspace for storage
    let workspace = await prisma.workspace.findUnique({
      where: { slug: "default" },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Default Workspace",
          slug: "default",
        },
      });
    }

    // Upsert YouTubeAccount record
    const googleId = channelItem.id;
    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    const ytAccount = await prisma.youTubeAccount.upsert({
      where: {
        workspaceId_googleId: {
          workspaceId: workspace.id,
          googleId,
        },
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        channelId: channelItem.id,
      },
      create: {
        workspaceId: workspace.id,
        googleId,
        email: "authorized_creator@youtube.com",
        channelId: channelItem.id,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope ? tokens.scope.split(" ") : [],
      },
    });

    // Upsert Channel catalog
    const subCount = parseInt(channelItem.statistics?.subscriberCount || "0", 10);
    const viewCount = parseInt(channelItem.statistics?.viewCount || "0", 10);
    const videoCount = parseInt(channelItem.statistics?.videoCount || "0", 10);

    await prisma.channel.upsert({
      where: { id: channelItem.id },
      update: {
        youtubeAccountId: ytAccount.id,
        title: channelItem.snippet?.title || "Connected Channel",
        customUrl: channelItem.snippet?.customUrl || null,
        description: channelItem.snippet?.description || null,
        avatarUrl: channelItem.snippet?.thumbnails?.high?.url || null,
        subscriberCount: BigInt(subCount),
        viewCount: BigInt(viewCount),
        videoCount,
        lastSyncedAt: new Date(),
      },
      create: {
        id: channelItem.id,
        youtubeAccountId: ytAccount.id,
        title: channelItem.snippet?.title || "Connected Channel",
        customUrl: channelItem.snippet?.customUrl || null,
        description: channelItem.snippet?.description || null,
        avatarUrl: channelItem.snippet?.thumbnails?.high?.url || null,
        subscriberCount: BigInt(subCount),
        viewCount: BigInt(viewCount),
        videoCount,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.redirect(
      new URL("/settings/youtube?success=connected", request.url)
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/settings/youtube?error=${encodeURIComponent(
          err?.message || "oauth_failed"
        )}`,
        request.url
      )
    );
  }
}
