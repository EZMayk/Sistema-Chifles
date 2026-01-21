'use client';

import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface CheckoutFormProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function CheckoutForm({ amount, orderId, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check payment intent status on page load (for redirect flows)
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('¡Pago completado exitosamente!');
          onSuccess();
          break;
        case 'processing':
          setMessage('Tu pago está siendo procesado.');
          break;
        case 'requires_payment_method':
          setMessage('Tu pago no fue exitoso, por favor intenta de nuevo.');
          break;
        default:
          setMessage('Algo salió mal.');
          break;
      }
    });
  }, [stripe, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pagos/confirmacion?orderId=${orderId}`,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected.
    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'Error en el pago');
        onError(error.message || 'Error en el pago');
      } else {
        setMessage('Ocurrió un error inesperado.');
        onError('Ocurrió un error inesperado.');
      }
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: 'tabs' as const,
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Total a pagar:</strong>{' '}
          <span className="text-xl font-bold">
            S/ {amount.toFixed(2)}
          </span>
        </p>
        <p className="text-xs text-amber-600 mt-1">Pedido #{orderId}</p>
      </div>

      <PaymentElement id="payment-element" options={paymentElementOptions} />

      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Procesando...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            Pagar S/ {amount.toFixed(2)}
          </>
        )}
      </button>

      {/* Show any error or success messages */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('exitoso')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm pt-4 border-t border-gray-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
          />
        </svg>
        Pago seguro procesado por Stripe
      </div>
    </form>
  );
}
