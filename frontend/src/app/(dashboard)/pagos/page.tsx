'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { StripeProvider, CheckoutForm } from '@/components/payments';
import { createPaymentIntent } from '@/services/paymentService';

// Iconos
const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-16 h-16">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

// Componente interno que usa useSearchParams
function PagosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Obtener datos de URL
  const monto = searchParams.get('monto');
  const pedidoId = searchParams.get('pedidoId');
  
  const amount = monto ? parseFloat(monto) : 0;
  const orderId = pedidoId || '';

  useEffect(() => {
    // Si no hay monto o pedidoId, mostrar formulario para ingresar manualmente
    if (!monto || !pedidoId) {
      setIsLoading(false);
      return;
    }

    // Crear Payment Intent con Stripe
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await createPaymentIntent({
          orderId: pedidoId,
          amount: parseFloat(monto),
          currency: 'pen', // Soles peruanos
          metadata: {
            source: 'frontend',
            timestamp: new Date().toISOString(),
          },
        });

        if (response.metadata?.clientSecret) {
          setClientSecret(response.metadata.clientSecret);
        } else {
          throw new Error('No se recibió el clientSecret');
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Error al inicializar el pago. Por favor intenta de nuevo.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [monto, pedidoId]);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Pantalla de éxito
  if (paymentSuccess) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="p-8 text-center">
          <div className="text-green-500 flex justify-center mb-4">
            <CheckIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h2>
          <p className="text-gray-600 mb-4">
            Tu pago de S/ {amount.toFixed(2)} ha sido procesado correctamente.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-6">
              Pedido #{orderId}
            </p>
          )}
          <div className="space-y-2">
            <button
              onClick={() => router.push('/pedidos')}
              className="w-full bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors"
            >
              Ver mis pedidos
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Si no hay datos de pago en URL, mostrar mensaje
  if (!monto || !pedidoId) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-600">Procesa el pago de tu pedido de forma segura</p>
        </div>

        <Card className="p-6">
          <div className="text-center py-8">
            <div className="p-4 bg-amber-100 rounded-full inline-flex mb-4">
              <CreditCardIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Selecciona un pedido para pagar
            </h2>
            <p className="text-gray-600 mb-6">
              Para procesar un pago, primero debes seleccionar un pedido desde la sección de pedidos.
            </p>
            <button
              onClick={() => router.push('/pedidos')}
              className="bg-amber-500 text-white py-2 px-6 rounded-lg hover:bg-amber-600 transition-colors"
            >
              Ver mis pedidos
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
            <p className="text-gray-600">Preparando el pago...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !clientSecret) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="p-4 bg-red-100 rounded-full inline-flex mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error al inicializar el pago
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => router.push('/pedidos')}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Volver a pedidos
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Checkout form with Stripe
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-600">Procesa el pago de tu pedido de forma segura con Stripe</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
            <CreditCardIcon />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Información de Pago</h2>
            <p className="text-sm text-gray-500">Ingresa los datos de tu tarjeta</p>
          </div>
        </div>

        {clientSecret && (
          <StripeProvider clientSecret={clientSecret}>
            <CheckoutForm
              amount={amount}
              orderId={orderId}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </StripeProvider>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </Card>
    </div>
  );
}

// Loading fallback para Suspense
function PagosLoading() {
  return (
    <div className="max-w-lg mx-auto p-6">
      <Card className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="space-y-3 mt-6">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Componente principal con Suspense boundary
export default function PagosPage() {
  return (
    <Suspense fallback={<PagosLoading />}>
      <PagosContent />
    </Suspense>
  );
}
