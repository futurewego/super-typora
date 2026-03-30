import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAccountById, getSession, recordSyncEvent } from "@/lib/cloud/store";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("super-markdown-workbench:session")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = getSession(sessionId);

  if (!session || session.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = getAccountById(session.userId);

  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    docId?: string;
    baseVersion?: number;
    nextVersion?: number;
    markdown?: string;
  };

  if (!body.docId || typeof body.baseVersion !== "number" || typeof body.nextVersion !== "number" || typeof body.markdown !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event = recordSyncEvent({
    userId: account.id,
    deviceId: session.deviceId,
    docId: body.docId,
    baseVersion: body.baseVersion,
    nextVersion: body.nextVersion,
    markdown: body.markdown,
  });

  return NextResponse.json({ event }, { status: 201 });
}
