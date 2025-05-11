// app/api/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Safepay } from '@sfpy/node-sdk';

// Create Safepay client
const safepay = new Safepay({
  //@ts-ignore
  environment: 'sandbox', // Use 'production' for live payments
  apiKey: process.env.SAFEPAY_API_KEY || 'sec_asd12-2342s-1231s', // Replace with your actual API key
  v1Secret: process.env.SAFEPAY_V1_SECRET || 'bar', // Replace with your actual secret
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET || 'foo' // Replace with your actual webhook secret
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { amount, currency, invoiceId } = await request.json();
    
    // Validate inputs
    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Amount and currency are required' },
        { status: 400 }
      );
    }
    
    // Create payment token
    const { token } = await safepay.payments.create({
      amount: amount,
      currency: currency // 'PKR' or 'USD'
    });
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Payment creation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}