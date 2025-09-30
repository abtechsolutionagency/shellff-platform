import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.PLATFORM_API_URL ??
  process.env.NEXT_PUBLIC_PLATFORM_API_URL ??
  'http://localhost:3333';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const response = await fetch(`${API_BASE_URL}/downloads/bundles/${params.id}`, {
    method: 'GET',
    headers: {
      ...(request.headers.get('authorization')
        ? { Authorization: request.headers.get('authorization') as string }
        : {}),
      'x-request-id': request.headers.get('x-request-id') ?? crypto.randomUUID(),
    },
    cache: 'no-store',
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to parse download bundle response', error);
    }
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch download bundle', details: payload },
      { status: response.status },
    );
  }

  return NextResponse.json(payload, { status: response.status });
}
