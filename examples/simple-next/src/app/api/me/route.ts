import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      session: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
    session: session.session,
  });
}
