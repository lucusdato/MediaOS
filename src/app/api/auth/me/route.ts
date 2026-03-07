import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      userId: user.userId,
      email: user.email,
      role: user.role,
    },
  });
}

export async function POST(request: NextRequest) {
  // Logout: clear the auth cookie
  const response = NextResponse.json({ success: true });

  response.cookies.set('mediaos-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
