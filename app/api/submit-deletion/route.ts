import { NextRequest, NextResponse } from "next/server";

const submissionApiUrl =
  process.env.DELETE_SUBMISSION_API_URL ??
  "https://taxi.technokrate.com/api/updateDeleteAccount";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, fullName, appType, notes, reference } = body;

    if (!phone && !fullName) {
      return NextResponse.json(
        { success: false, message: "Phone or full name is required" },
        { status: 400 },
      );
    }

    // Try to submit to the backend
    const response = await fetch(submissionApiUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        phone,
        fullName,
        app_type: appType,
        description: notes || "",
        reference,
      }),
    });

    // If the API doesn't exist (404) or returns HTML (not JSON), return fallback
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({
        success: false,
        message: "Deletion API not available, use email fallback",
        fallback: true,
      });
    }

    const payload = await response.json();

    return NextResponse.json({
      success: response.ok,
      message:
        payload.message ||
        (response.ok ? "Deletion request submitted" : "Failed to submit"),
      data: response.ok ? payload : null,
      fallback: false,
    });
  } catch {
    // If the API is unreachable, tell the frontend to use email fallback
    return NextResponse.json({
      success: false,
      message: "Deletion API not available, use email fallback",
      fallback: true,
    });
  }
}
