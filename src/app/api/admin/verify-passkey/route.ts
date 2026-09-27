import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ADMIN_PASSKEY = 'QuizRush@Admin2026!';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputPasskey = (body.passkey || '').trim();

    if (!inputPasskey) {
      return NextResponse.json(
        { success: false, message: 'Passkey is required.' },
        { status: 400 }
      );
    }

    const candidateKeys = [
      process.env.ADMIN_SECRET_KEY,
      process.env.NEXT_PUBLIC_ADMIN_PASSKEY,
      process.env.ADMIN_PASSKEY,
      DEFAULT_ADMIN_PASSKEY,
    ]
      .filter((k): k is string => Boolean(k && k.trim()))
      .map((k) => k.trim());

    // Check exact match or case-insensitive match
    const isMatch = candidateKeys.some(
      (key) => key === inputPasskey || key.toLowerCase() === inputPasskey.toLowerCase()
    );

    if (isMatch) {
      return NextResponse.json({
        success: true,
        message: 'Admin authorization verified.',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid passkey. Access denied.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error verifying admin passkey:', error);
    return NextResponse.json(
      { success: false, message: 'Server error verifying passkey.' },
      { status: 500 }
    );
  }
}
