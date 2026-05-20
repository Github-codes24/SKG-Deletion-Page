import { NextRequest, NextResponse } from "next/server";

const defaultPolicy =
  "All personal data will be permanently removed from our systems within 7 working days.";

const policyApiUrl =
  process.env.DELETE_POLICY_API_URL ??
  "https://taxi.technokrate.com/api/getDeleteAccount";

type AccountInfo = {
  name?: string;
  phone?: string;
  email?: string;
  appType?: string;
};

function extractPolicy(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    data?: { description?: unknown };
    description?: unknown;
    message?: unknown;
  };

  if (typeof response.data?.description === "string") {
    return response.data.description;
  }

  if (typeof response.description === "string") {
    return response.description;
  }

  if (typeof response.message === "string" && response.message.length > 20) {
    return response.message;
  }

  return null;
}

function extractAccountInfo(payload: unknown): AccountInfo | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    data?: {
      name?: unknown;
      phone?: unknown;
      email?: unknown;
      app_type?: unknown;
      fullName?: unknown;
    };
    name?: unknown;
    phone?: unknown;
    email?: unknown;
    user?: {
      name?: unknown;
      phone?: unknown;
      email?: unknown;
      app_type?: unknown;
    };
  };

  // Try nested data object first
  if (response.data) {
    const info: AccountInfo = {};
    if (typeof response.data.name === "string") info.name = response.data.name;
    if (typeof response.data.fullName === "string")
      info.name = response.data.fullName;
    if (typeof response.data.phone === "string")
      info.phone = response.data.phone;
    if (typeof response.data.email === "string")
      info.email = response.data.email;
    if (typeof response.data.app_type === "string")
      info.appType = response.data.app_type;
    if (Object.keys(info).length > 0) return info;
  }

  // Try nested user object
  if (response.user) {
    const info: AccountInfo = {};
    if (typeof response.user.name === "string") info.name = response.user.name;
    if (typeof response.user.phone === "string")
      info.phone = response.user.phone;
    if (typeof response.user.email === "string")
      info.email = response.user.email;
    if (typeof response.user.app_type === "string")
      info.appType = response.user.app_type;
    if (Object.keys(info).length > 0) return info;
  }

  // Try top-level fields
  const info: AccountInfo = {};
  if (typeof response.name === "string") info.name = response.name;
  if (typeof response.phone === "string") info.phone = response.phone;
  if (typeof response.email === "string") info.email = response.email;
  if (Object.keys(info).length > 0) return info;

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    // Build URL with query params if identifier is provided
    const url = new URL(policyApiUrl);
    if (phone) url.searchParams.set("phone", phone);
    if (email) url.searchParams.set("email", email);

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok || !contentType.includes("application/json")) {
      return NextResponse.json({
        description: defaultPolicy,
        source: "fallback" as const,
        account: null,
      });
    }

    const payload = await response.json();
    console.log("Payload from API", payload);

    const description = extractPolicy(payload);
    const account = extractAccountInfo(payload);

    return NextResponse.json({
      description: description ?? defaultPolicy,
      source: (description ? "api" : "fallback") as "api" | "fallback",
      account,
    });
  } catch {
    return NextResponse.json({
      description: defaultPolicy,
      source: "fallback" as const,
      account: null,
    });
  }
}
