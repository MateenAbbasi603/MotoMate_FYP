// app/success/page.tsx
export default function SuccessPage() {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="mb-6">Your order has been processed successfully.</p>
        <a 
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Home
        </a>
      </div>
    );
  }