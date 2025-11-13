import { NextResponse } from "next/server";

const CLEAR_COOKIE_SETTINGS = {
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 0
};

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("ops_token", "", CLEAR_COOKIE_SETTINGS);
  response.cookies.set("ops_actor_id", "", CLEAR_COOKIE_SETTINGS);
  response.cookies.set("ops_actor_role", "", CLEAR_COOKIE_SETTINGS);
  return response;
}

