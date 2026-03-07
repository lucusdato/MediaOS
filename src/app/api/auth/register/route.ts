import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, getAuthUser } from '@/lib/auth';
import { registerSchema } from '@/lib/validations/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can register new users' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash, name, role },
    });

    logger.info('User registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
      registeredBy: authUser.userId,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Registration error', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
