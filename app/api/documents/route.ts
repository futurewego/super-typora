import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createCloudDocument,
  getAccountById,
  getSession,
  listCloudDocuments,
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

  return getAccountById(session.userId);
}

export async function GET() {
  const account = await getAuthedUser();

  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ documents: listCloudDocuments(account.id) });
}

export async function POST(request: Request) {
  const account = await getAuthedUser();

  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    markdown?: string;
    source?: "blank" | "imported" | "recovered" | "cloud";
  };

  if (!body.title?.trim() || typeof body.markdown !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const document = createCloudDocument({
    userId: account.id,
    title: body.title,
    markdown: body.markdown,
    source: body.source,
  });

  return NextResponse.json({ document }, { status: 201 });
}
