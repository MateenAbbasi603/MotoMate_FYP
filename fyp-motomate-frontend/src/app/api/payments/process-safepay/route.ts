// app/api/payments/process-safepay/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, transactionId } = body;
    
    // Validate inputs
    if (!invoiceId || !transactionId) {
      return NextResponse.json(
        { error: 'InvoiceId and transactionId are required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing payment for invoice #${invoiceId} with transaction ${transactionId}`);
    
    // Make a call to your backend at http://localhost:5177
    const apiResponse = await fetch('http://localhost:5177/api/payments/process-safepay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include authorization header if available
        ...(request.headers.get('authorization') ? 
          {'Authorization': request.headers.get('authorization')!} : {})
      },
      body: JSON.stringify({
        invoiceId,
        transactionId
      })
    });
    
    console.log('API Response status:', apiResponse.status);
    
    if (!apiResponse.ok) {
      let errorMessage = 'Failed to process payment';
      try {
        const errorData = await apiResponse.json();
        errorMessage = errorData.message || errorMessage;
        console.error('API Error:', errorData);
      } catch (e) {
        console.error('Error parsing API error response:', e);
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: apiResponse.status }
      );
    }
    
    const data = await apiResponse.json();
    console.log('API Success response:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      ...data
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process payment',
        error: error.message 
      },
      { status: 500 }
    );
  }
}