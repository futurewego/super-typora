import { NextResponse } from "next/server";

import { createSession } from "@/lib/cloud/store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    deviceId?: string;
  };

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const deviceId = body.deviceId?.trim() || crypto.randomUUID();
  const { account, session } = createSession(body.email, deviceId);
  const response = NextResponse.json({ account, session });

  response.cookies.set("super-markdown-workbench:session", session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  });

  return response;
}
