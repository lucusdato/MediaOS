import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  let database = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    // Database connection failed
  }

  const status = database ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      database,
    },
    { status: database ? 200 : 503 }
  );
}
