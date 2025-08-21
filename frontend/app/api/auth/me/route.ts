// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
const API = process.env.FASTAPI_URL ?? 'http://localhost:8000';

export async function GET() {
  const r = await fetch(`${API}/auth/me`, { credentials: 'include' });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  const resp = NextResponse.json(data, { status: r.status });
  const setCookie = r.headers.get('set-cookie');
  if (setCookie) resp.headers.append('set-cookie', setCookie);
  return resp;
}