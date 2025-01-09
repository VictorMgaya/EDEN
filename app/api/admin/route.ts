/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const ADMIN_KEY = process.env.ADMIN_KEY;

export async function GET(request: Request) {
  const headersList = await headers();
  const adminKey = headersList.get("admin-key");

  if (!adminKey || adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ status: "Authorized" });
}

export async function POST(request: Request) {
  const headersList = await headers();
  const adminKey = headersList.get("admin-key");

  if (!adminKey || adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ status: "Authorized" });
}