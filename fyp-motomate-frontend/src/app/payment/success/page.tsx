// app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract the invoice ID
  const invoiceId = searchParams.get('invoice');
  console.log("INVOICE ID ", invoiceId);


  // Clean up and extract the token - the token might contain query params
  let token = searchParams.get('token') || '';
  if (token.includes('?')) {
    token = token.split('?')[0];
  }

  console.log("TOKE ", token);


  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Success page loaded with:');
    console.log('- Invoice ID:', invoiceId);
    console.log('- Token:', token);
    console.log('- Raw URL:', window.location.href);

    const processPayment = async () => {
      if (!invoiceId) {
        setError('Missing invoice information');
        setIsProcessing(false);
        return;
      }

      try {
        // For debugging purposes, log raw data
        console.log(`Processing payment for invoice ${invoiceId} with token ${token}`);

        // Call the backend API to process the payment
        const response = await fetch(`http://localhost:5177/api/payments/process-safepay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            invoiceId: parseInt(invoiceId),
            transactionId: token || 'safepay_payment' // Fallback if token is empty
          })
        });

        console.log('Backend response status:', response.status);

        if (!response.ok) {
          let errorMessage = 'Failed to process payment';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            console.error('Error data:', errorData);
          } catch (e) {
            // If response is not JSON, try to get text
            errorMessage = await response.text();
            console.error('Error text:', errorMessage);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Payment processing response:', data);

        if (data.success) {
          setSuccess(true);
        } else {
          throw new Error(data.message || 'Payment processing failed');
        }
      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [invoiceId, token]);

  return (
    <div className="max-w-md mx-auto mt-16 p-6 text-center">
      <Card>
        <CardHeader>
          <CardTitle>{isProcessing ? 'Processing Payment...' : success ? 'Payment Successful!' : 'Payment Failed'}</CardTitle>
          <CardDescription>
            {isProcessing
              ? 'Please wait while we process your payment...'
              : success
                ? 'Your payment has been processed successfully.'
                : 'There was an issue processing your payment.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin"></div>
              <p>Processing your transaction...</p>
            </div>
          ) : success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Invoice #{invoiceId} has been paid successfully.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || 'An unknown error occurred'}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          {!isProcessing && (
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Debug info - remove in production */}
      <div className="mt-6 text-xs text-left text-gray-500 p-4 border rounded bg-gray-50">
        <p><strong>Debug Info:</strong></p>
        <p>Invoice ID: {invoiceId}</p>
        <p>Token: {token}</p>
        <p>Processing: {isProcessing ? 'Yes' : 'No'}</p>
        <p>Success: {success ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
      </div>
    </div>
  );
}