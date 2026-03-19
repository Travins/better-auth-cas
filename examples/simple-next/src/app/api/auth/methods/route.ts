import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    emailPassword: true,
    ssoCas: true,
  });
}
