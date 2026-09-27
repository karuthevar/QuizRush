import { NextRequest, NextResponse } from 'next/server';

// Maintain in-memory game session cache in globalThis to persist across requests on server
const getGlobalSessions = (): Map<string, any> => {
  if (!(globalThis as any)._quizrush_game_sessions) {
    (globalThis as any)._quizrush_game_sessions = new Map<string, any>();
  }
  return (globalThis as any)._quizrush_game_sessions;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { pin: string } }
) {
  const pin = (params.pin || '').toUpperCase();
  const sessions = getGlobalSessions();
  const session = sessions.get(pin);

  if (!session) {
    return NextResponse.json({ success: false, session: null }, { status: 404 });
  }

  return NextResponse.json({ success: true, session });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { pin: string } }
) {
  try {
    const pin = (params.pin || '').toUpperCase();
    const body = await req.json();
    const { session } = body;

    if (!session || !pin) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload' },
        { status: 400 }
      );
    }

    const sessions = getGlobalSessions();
    sessions.set(pin, session);

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
