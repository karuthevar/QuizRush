import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'guest-host', userEmail, origin } = body;

    const baseOrigin =
      origin ||
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const stripeApiKey = process.env.STRIPE_SECRET_KEY;

    // Production mode with Stripe configured
    if (stripeApiKey && stripeApiKey !== 'sk_test_placeholder') {
      const stripe = new Stripe(stripeApiKey, {
        apiVersion: '2024-06-20' as any,
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: 499, // $4.99
              product_data: {
                name: 'QuizRush Single Match Pass (1 Quiz)',
                description:
                  'Host 1 full live multiplayer quiz match with live audio, QR joining, up to 100 players, and leaderboard podium.',
                images: [
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
                ],
              },
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: userEmail || undefined,
        client_reference_id: userId,
        success_url: `${baseOrigin}/host/checkout/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}`,
        cancel_url: `${baseOrigin}/host/dashboard?canceled=true`,
      });

      return NextResponse.json({
        success: true,
        simulated: false,
        url: session.url,
      });
    }

    // Free / Simulated Demo Mode (when Stripe keys aren't added yet)
    return NextResponse.json({
      success: true,
      simulated: true,
      url: `${baseOrigin}/host/checkout/success?simulated=true&userId=${userId}`,
      message: 'Simulated payment checkout initialized.',
    });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate checkout.' },
      { status: 500 }
    );
  }
}
