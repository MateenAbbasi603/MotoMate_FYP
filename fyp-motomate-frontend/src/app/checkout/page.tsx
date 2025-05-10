'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Simple product type
interface Product {
  id: string;
  name: string;
  price: number;
}

// Hardcoded products with prices in PKR
const products: Product[] = [
  { id: 'prod1', name: 'Premium Leather Wallet', price: 3500 },
  { id: 'prod2', name: 'Wireless Earbuds', price: 12000 },
  { id: 'prod3', name: 'Stainless Steel Water Bottle', price: 2200 }
];

export default function SafepayCheckoutTest() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setError(null);
  };
  
  const handleCheckout = async () => {
    if (!selectedProduct) {
      setError('Please select a product first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Create a payment token
      const paymentResponse = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedProduct.price, currency: 'PKR' })
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
          orderId: `order-${Date.now()}`,
          productName: selectedProduct.name
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
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Safepay Checkout Test</h1>
      
      {/* Product Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Select a Product:</h2>
        <div className="space-y-2">
          {products.map(product => (
            <div 
              key={product.id}
              onClick={() => handleSelectProduct(product)}
              className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                selectedProduct?.id === product.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between">
                <span>{product.name}</span>
                <span className="font-semibold">PKR {product.price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={isLoading || !selectedProduct}
        className={`w-full py-3 rounded-md font-medium text-white ${
          isLoading || !selectedProduct
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Processing...' : 'Checkout with Safepay'}
      </button>
      
      <p className="mt-4 text-sm text-gray-500 text-center">
        Test integration with Safepay payment gateway
      </p>
    </div>
  );
}