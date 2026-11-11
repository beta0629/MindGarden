import { NextResponse } from 'next/server';

// Admin status updates were removed with the homepage admin UI.
// The previous blog_admin_token cookie check was not a real auth gate
// (any non-empty cookie value passed) and /api/blog/auth no longer exists.
export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Not found' },
    { status: 404 },
  );
}
