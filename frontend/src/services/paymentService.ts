import axios from 'axios';

// Payment Service API client
const paymentClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos para pagos
});

// Interceptor para añadir Authorization
paymentClient.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.warn('Payment API request interceptor error', e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResponse {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  metadata: {
    clientSecret: string;
    paymentIntentId: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatusResponse {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new payment intent with Stripe
 */
export async function createPaymentIntent(
  data: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> {
  const response = await paymentClient.post<PaymentIntentResponse>('/payments/create', {
    ...data,
    provider: 'stripe',
  });
  return response.data;
}

/**
 * Get payment status by transaction ID
 */
export async function getPaymentStatus(
  transactionId: string
): Promise<PaymentStatusResponse> {
  const response = await paymentClient.get<PaymentStatusResponse>(
    `/payments/transaction/${transactionId}`
  );
  return response.data;
}

/**
 * Get all payments for an order
 */
export async function getPaymentsByOrderId(
  orderId: string
): Promise<PaymentStatusResponse[]> {
  const response = await paymentClient.get<PaymentStatusResponse[]>(
    `/payments/order/${orderId}`
  );
  return response.data;
}

/**
 * Confirm a payment (usually called by webhook, but available for manual confirmation)
 */
export async function confirmPayment(
  transactionId: string,
  metadata?: Record<string, any>
): Promise<PaymentStatusResponse> {
  const response = await paymentClient.post<PaymentStatusResponse>('/payments/confirm', {
    transactionId,
    metadata,
  });
  return response.data;
}

export default paymentClient;
