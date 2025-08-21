// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

const API = process.env.FASTAPI_URL ?? 'http://localhost:8000';

export async function POST(req: Request) {
  const body = await req.json();
  // forward to FastAPI and include credentials so it can set cookies
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    // When Next proxies to a different origin, we must forward Set-Cookie manually:
    credentials: 'include',
  });

  const text = await r.text();
  const data = text ? JSON.parse(text) : {};

  // Copy Set-Cookie from FastAPI to client
  const resp = NextResponse.json(data, { status: r.status });
  const setCookie = r.headers.get('set-cookie');
  if (setCookie) resp.headers.append('set-cookie', setCookie);
  return resp;
}