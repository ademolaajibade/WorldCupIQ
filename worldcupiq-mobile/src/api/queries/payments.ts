import { apiClient } from '../client';

export type PaymentPlan = 'premium' | 'tournament';

export const paymentsApi = {
  initiate: (plan: PaymentPlan, currency: 'NGN' | 'USD') =>
    apiClient
      .post<{ paymentUrl: string; reference: string }>('/payments/initialize', { plan, currency })
      .then((r) => r.data),

  verify: (reference: string) =>
    apiClient
      .get<{ success: boolean; plan: string; message: string }>(`/payments/verify/${reference}`)
      .then((r) => r.data),
};
