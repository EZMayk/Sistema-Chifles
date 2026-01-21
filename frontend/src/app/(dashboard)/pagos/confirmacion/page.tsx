'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { confirmPayment } from '@/services/paymentService';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const paymentIntent = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const processPaymentConfirmation = async () => {
      if (redirectStatus === 'succeeded' && paymentIntent) {
        try {
          // Confirmar el pago en el backend - esto actualiza el estado del pedido
          await confirmPayment(paymentIntent, {
            confirmedVia: 'redirect',
            confirmedAt: new Date().toISOString(),
            orderId: orderId,
          });
          
          setStatus('success');
          setMessage('¡Tu pago ha sido procesado y tu pedido ha sido actualizado!');
        } catch (err) {
          console.error('Error confirming payment:', err);
          // Aún así mostrar éxito ya que Stripe procesó el pago
          setStatus('success');
          setMessage('¡Tu pago ha sido procesado exitosamente!');
        }
      } else if (redirectStatus === 'processing') {
        setStatus('loading');
        setMessage('Tu pago está siendo procesado...');
      } else if (redirectStatus === 'requires_payment_method') {
        setStatus('error');
        setMessage('El pago no fue exitoso. Por favor intenta con otro método de pago.');
      } else {
        setStatus('error');
        setMessage('Ocurrió un error con tu pago. Por favor contacta a soporte.');
      }
    };

    processPaymentConfirmation();
  }, [redirectStatus, paymentIntent, orderId]);

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Procesando pago...
          </h2>
          <p className="text-gray-600">{message}</p>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="p-8 text-center">
          <div className="text-green-500 flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h2>
          <p className="text-gray-600 mb-4">{message}</p>
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

  // Error state
  return (
    <div className="max-w-md mx-auto mt-10">
      <Card className="p-8 text-center">
        <div className="text-red-500 flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Error en el Pago
        </h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="space-y-2">
          <button
            onClick={() => router.push(orderId ? `/pagos?pedidoId=${orderId}&monto=` : '/pagos')}
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
      </Card>
    </div>
  );
}

function ConfirmacionLoading() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Verificando pago...
        </h2>
      </Card>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<ConfirmacionLoading />}>
      <ConfirmacionContent />
    </Suspense>
  );
}
