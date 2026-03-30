import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getAccountById,
  getCloudDocument,
  getSession,
  recordSyncEvent,
  updateCloudDocument,
} from "@/lib/cloud/store";

async function getAuthedUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("super-markdown-workbench:session")?.value;

  if (!sessionId) {
    return null;
  }

  const session = getSession(sessionId);

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return session;
}

export async function GET(_: Request, { params }: { params: Promise<{ docId: string }> }) {
  const session = await getAuthedUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;
  const account = getAccountById(session.userId);
  const document = account ? getCloudDocument(account.id, docId) : undefined;

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ document });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ docId: string }> }) {
  const session = await getAuthedUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;
  const account = getAccountById(session.userId);

  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    markdown?: string;
    source?: "blank" | "imported" | "recovered" | "cloud";
    baseVersion?: number;
    lastOpenedAt?: number;
  };

  const result = updateCloudDocument({
    userId: account.id,
    docId,
    title: body.title,
    markdown: body.markdown,
    source: body.source,
    baseVersion: body.baseVersion,
    lastOpenedAt: body.lastOpenedAt,
  });

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Conflict", conflict: result.conflict },
      { status: 409 },
    );
  }

  recordSyncEvent({
    userId: account.id,
    deviceId: session.deviceId,
    docId: result.document.id,
    baseVersion: body.baseVersion ?? result.document.version - 1,
    nextVersion: result.document.version,
    markdown: result.document.markdown,
  });

  return NextResponse.json({ document: result.document });
}
