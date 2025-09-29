
import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/refresh-tokens";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }
    
    const tokens = await refreshAccessToken(refreshToken);
    
    if (!tokens) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
    
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
