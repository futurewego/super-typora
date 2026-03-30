import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAccountById, getSession, touchDevice } from "@/lib/cloud/store";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("super-markdown-workbench:session")?.value;

  if (!sessionId) {
    return NextResponse.json({ account: null }, { status: 200 });
  }

  const session = getSession(sessionId);

  if (!session || session.expiresAt < Date.now()) {
    return NextResponse.json({ account: null }, { status: 200 });
  }

  const account = getAccountById(session.userId);

  if (!account) {
    return NextResponse.json({ account: null }, { status: 200 });
  }

  touchDevice(account.id, session.deviceId);
  return NextResponse.json({ account });
}
