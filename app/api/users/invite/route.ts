import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/**
 * POST — proxy to Laravel POST /users/invite
 * GET  — proxy to Laravel GET /users/invite/validate?token=xxx
 *
 * These routes exist so the frontend cadastro/set-password pages
 * can call /api/users/invite without needing to talk directly to
 * the Laravel backend (useful during development or when the
 * Next.js and Laravel are on the same host).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward Authorization header if present (protected route)
    const authHeader = request.headers.get("authorization");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(`${API_URL}/users/invite`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("invite proxy error:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token não informado." }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/users/invite/validate?token=${token}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("invite validate proxy error:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
