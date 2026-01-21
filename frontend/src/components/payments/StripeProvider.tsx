'use client';

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret: string;
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#f59e0b', // amber-500
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1px solid #d1d5db',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '2px solid #f59e0b',
          boxShadow: '0 0 0 1px #f59e0b',
        },
        '.Label': {
          fontWeight: '500',
          fontSize: '14px',
          marginBottom: '4px',
        },
      },
    },
    locale: 'es' as const,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
