import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/v1/youtube/callback";

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "OAUTH_CONFIG_MISSING",
          message:
            "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env to connect your YouTube channel.",
          status: 500,
        },
      },
      { status: 500 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const scopes = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  return NextResponse.json({
    success: true,
    data: { authUrl },
  });
}
