// src/app/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamically import the LandingPage component with client-side rendering
const LandingPage = dynamic(() => import('@/components/LandingPage'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <span className="ml-2 text-lg font-medium">Loading MotoMate...</span>
    </div>
  )
});

export default function Home() {
  return (
    <main>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <span className="ml-2 text-lg font-medium">Loading MotoMate...</span>
        </div>
      }>
        <LandingPage />
      </Suspense>
    </main>
  );
}