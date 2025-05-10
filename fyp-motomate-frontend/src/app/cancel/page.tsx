// app/cancel/page.tsx
export default function CancelPage() {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
        <p className="mb-6">Your payment was cancelled. No charges were made.</p>
        <a 
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </a>
      </div>
    );
  }