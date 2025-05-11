// app/api/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Safepay } from '@sfpy/node-sdk';

// Create Safepay client
const safepay = new Safepay({
  //@ts-ignore
  environment: 'sandbox',
  apiKey: process.env.SAFEPAY_API_KEY || 'sec_asd12-2342s-1231s',
  v1Secret: process.env.SAFEPAY_V1_SECRET || 'bar',
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET || 'foo'
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { token, orderId, invoiceId } = await request.json();
    
    // Validate inputs
    if (!token || !orderId) {
      return NextResponse.json(
        { error: 'Token and orderId are required' },
        { status: 400 }
      );
    }
    
    // Get base URL with fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Create checkout URL - remove token from redirect URL to avoid issues
    const url = safepay.checkout.create({
      token,
      orderId,
      cancelUrl: `${baseUrl}/payment/cancel?invoice=${invoiceId}`,
      redirectUrl: `${baseUrl}/payment/success?invoice=${invoiceId}`,
      source: 'custom',
      webhooks: true
    });
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Checkout creation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to create checkout URL' },
      { status: 500 }
    );
  }
}