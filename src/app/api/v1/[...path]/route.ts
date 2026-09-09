import { type NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_URL ?? "http://localhost:3100").replace(/\/$/, "");

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = `${BACKEND}/api/v1/${params.path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (!["host", "connection", "transfer-encoding"].includes(k)) headers.set(k, v);
  });

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, { method: req.method, headers, body, redirect: "manual" });

  const resHeaders = new Headers();
  upstream.headers.forEach((v, k) => {
    if (!["connection", "transfer-encoding"].includes(k)) resHeaders.set(k, v);
  });

  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

export const GET     = proxy;
export const POST    = proxy;
export const PATCH   = proxy;
export const PUT     = proxy;
export const DELETE  = proxy;
export const OPTIONS = proxy;
