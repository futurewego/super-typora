const DEVICE_ID_KEY = "super-markdown-workbench:device-id";

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") {
    return "server-device";
  }

  const existing = window.localStorage.getItem(DEVICE_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(DEVICE_ID_KEY, nextId);
  return nextId;
}
