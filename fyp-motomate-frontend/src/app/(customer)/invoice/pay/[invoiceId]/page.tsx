// app/invoice/pay/[invoiceId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InvoiceItem {
    invoiceItemId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Invoice {
    invoiceId: number;
    orderId: number;
    userId: number;
    subTotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    invoiceDate: string;
    status: string;
    dueDate: string;
}

export default function PayInvoicePage() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = Number(params.invoiceId);

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (!invoiceId) return;

        // In app/invoice/pay/[invoiceId]/page.tsx
        const fetchInvoice = async () => {
            try {
                // Get the authentication token from localStorage
                const token = localStorage.getItem('token');

                const response = await fetch(`http://localhost:5177/api/invoices/${invoiceId}`, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch invoice: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log("API Response:", data); // Log the entire response for debugging

                if (data.success) {
                    setInvoice(data.invoice);

                    // Handle different possible formats of invoice items
                    let items = [];
                    if (Array.isArray(data.invoiceItems)) {
                        items = data.invoiceItems;
                    } else if (data.invoiceItems && data.invoiceItems.$values) {
                        items = data.invoiceItems.$values;
                    } else if (data.invoice && data.invoice.invoiceItems) {
                        if (Array.isArray(data.invoice.invoiceItems)) {
                            items = data.invoice.invoiceItems;
                        } else if (data.invoice.invoiceItems.$values) {
                            items = data.invoice.invoiceItems.$values;
                        }
                    }

                    setInvoiceItems(items);

                    // Check if invoice is already paid
                    if (data.invoice.status.toLowerCase() === 'paid') {
                        setPaymentSuccess(true);
                    }
                } else {
                    setError(data.message || 'Failed to fetch invoice details');
                }
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId, router]);

    
   // Modified handlePayNow function for invoice payment page
const handlePayNow = async () => {
    if (!invoice) return;

    setIsProcessing(true);
    setError(null);

    try {
        // Step 1: Create a payment token
        const paymentResponse = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: invoice.totalAmount, 
                currency: 'PKR',
                invoiceId: invoice.invoiceId
            })
        });
        
        if (!paymentResponse.ok) {
            throw new Error('Failed to create payment');
        }
        
        const { token } = await paymentResponse.json();
        
        // Step 2: Create checkout URL
        const checkoutResponse = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token,
                orderId: `invoice-${invoice.invoiceId}`,
                invoiceId: invoice.invoiceId
            })
        });
        
        if (!checkoutResponse.ok) {
            throw new Error('Failed to create checkout URL');
        }
        
        const { url } = await checkoutResponse.json();
        
        // Step 3: Redirect to Safepay checkout
        window.location.href = url;
        
    } catch (err) {
        console.error('Checkout error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsProcessing(false);
    }
};

    if (loading) {
        return (
            <div className="container max-w-3xl mx-auto p-4 py-8">
                <Skeleton className="h-12 w-3/4 mb-6" />
                <Skeleton className="h-48 w-full mb-6" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container max-w-3xl mx-auto p-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="mt-4">
                    <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="container max-w-3xl mx-auto p-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Found</AlertTitle>
                    <AlertDescription>Invoice not found or you don't have permission to access it.</AlertDescription>
                </Alert>
                <div className="mt-4">
                    <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl mx-auto p-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice #{invoice.invoiceId}</CardTitle>
                    <CardDescription>
                        Order #{invoice.orderId} • Invoice Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Invoice Items */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Services</h3>
                        <div className="space-y-2">
                            {Array.isArray(invoiceItems) && invoiceItems.length > 0 ? (
                                invoiceItems.map((item) => (
                                    <div key={item.invoiceItemId || `item-${Math.random()}`} className="flex justify-between">
                                        <span>{item.description} ({item.quantity})</span>
                                        <span>PKR {item.totalPrice?.toLocaleString()}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500">No items found</div>
                            )}
                        </div>
                        <hr className="my-4" />
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>PKR {invoice.subTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax ({invoice.taxRate}%)</span>
                            <span>PKR {invoice.taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2">
                            <span>Total</span>
                            <span>PKR {invoice.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Payment Status */}
                    {paymentSuccess ? (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle>Payment Complete</AlertTitle>
                            <AlertDescription>
                                This invoice has been paid successfully.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        invoice.status.toLowerCase() === 'paid' ? (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle>Payment Complete</AlertTitle>
                                <AlertDescription>
                                    This invoice has been paid successfully.
                                </AlertDescription>
                            </Alert>
                        ) : null
                    )}

                    {/* Error Message */}
                    {error && !paymentSuccess && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        Back
                    </Button>

                    {!paymentSuccess && invoice.status.toLowerCase() !== 'paid' && (
                        <Button
                            onClick={handlePayNow}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isProcessing ? 'Processing...' : 'Pay Now with Safepay'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}