import { NextResponse } from "next/server";
import { createLogoutCookie } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    data: { authenticated: false },
    message: "Logged out successfully.",
  });

  // Clear session cookie
  response.headers.set("Set-Cookie", createLogoutCookie());
  return response;
}
