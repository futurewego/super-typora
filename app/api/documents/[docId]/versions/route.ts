import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAccountById, getSession, listCloudVersions } from "@/lib/cloud/store";

export async function GET(_: Request, { params }: { params: Promise<{ docId: string }> }) {
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

  const { docId } = await params;
  return NextResponse.json({ versions: listCloudVersions(account.id, docId) });
}
