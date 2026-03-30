"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentAccount, loginAccount } from "@/lib/cloud/http";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { account } = await getCurrentAccount();
      if (account) {
        router.replace("/");
      }
    })();
  }, [router]);

  async function handleSubmit() {
    setBusy(true);
    setError(null);

    try {
      await loginAccount(email);
      router.replace("/");
      router.refresh();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grain flex flex-1 items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow)] backdrop-blur-xl">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Account access
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[color:var(--foreground)]">
              Sign in to your cloud workspace
            </h1>
            <p className="max-w-lg text-base leading-8 text-[color:var(--muted)]">
              Enter your email and we will create a workspace session for this device.
            </p>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-[color:var(--foreground)]"
            >
              Email
            </label>
            <input
              id="login-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm outline-none"
              placeholder="you@example.com"
            />
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy || !email.trim()}
              onClick={() => {
                void handleSubmit();
              }}
              className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface)] disabled:opacity-50"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-medium text-[color:var(--foreground)]"
            >
              Back
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
