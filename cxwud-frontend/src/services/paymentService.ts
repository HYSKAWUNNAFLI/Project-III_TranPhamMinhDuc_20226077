import { apiClient } from "./api";

/**
 * Payment-related types
 */
export type PaymentProvider = "PAYPAL" | "VIETQR";

export interface CreatePaymentRequest {
  orderId: number;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  successReturnUrl: string;
  cancelReturnUrl: string;
}

export interface Payment {
  id: number; // Might be undefined if backend sends transactionId
  transactionId?: number; // Backend sends this
  orderId: number;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status?: string;
  providerReference?: string;
  approvalUrl?: string; // PayPal redirect URL
  qrContent?: string; // VietQR content
  createdAt?: string;
  updatedAt?: string;
}

export interface VietQRResponse {
  qrContent?: string;
  qrImage?: string;
  transactionId?: string;
  // legacy fields when using PayOS payment link (kept for compatibility)
  paymentLinkId?: string;
  qrCode?: string;
  amount?: number;
  orderCode?: number;
  status?: string;
}

export interface PayOSPaymentStatus {
  id: string;
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: string;
  createdAt: string;
  transactions: any[];
  canceledAt?: string | null;
  cancellationReason?: string | null;
}

export interface CapturePaymentResponse {
  success: boolean;
  message?: string;
  payment?: Payment;
}


interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Create a payment (initialize payment with provider)
 * POST /payments
 *
 * @param paymentData - Payment details including orderId, provider, amount
 * @returns Payment object with approval URL (for PayPal) or payment info
 *
 * @example
 * const payment = await paymentService.createPayment({
 *   orderId: 123,
 *   provider: 'PAYPAL',
 *   amount: 40.00,
 *   currency: 'USD',
 *   successReturnUrl: 'http://localhost:3000/payment/success',
 *   cancelReturnUrl: 'http://localhost:3000/payment/cancel'
 * });
 *
 * // Redirect user to PayPal
 * if (payment.approvalUrl) {
 *   window.location.href = payment.approvalUrl;
 * }
 */
export async function createPayment(
  paymentData: CreatePaymentRequest
): Promise<Payment> {
  const response = await apiClient.post<ApiResponse<Payment>>("/payments", paymentData);
  return response.data.data;
}

/**
 * Capture/complete a payment after user approval
 * POST /payments/{id}/capture?providerReference={providerReference}
 *
 * Called after user returns from PayPal (or other provider)
 *
 * @param paymentId - Payment ID from createPayment
 * @param providerReference - Provider's order/transaction ID (from query params)
 * @returns Capture result
 *
 * @example
 * // After PayPal redirect to success URL with ?token=...&PayerID=...
 * const result = await paymentService.capturePayment(123, 'PAYPAL_ORDER_ID');
 */
export async function capturePayment(
  paymentId: number | string,
  providerReference: string
): Promise<CapturePaymentResponse> {
  const response = await apiClient.post<ApiResponse<CapturePaymentResponse>>(
    `/payments/${paymentId}/capture`,
    null,
    {
      params: { providerReference },
    }
  );
  return response.data.data;
}


/**
 * Get payment details by ID (if backend supports)
 * GET /payments/{id}
 *
 * @param paymentId - Payment ID
 * @returns Payment details
 */
export async function getPayment(paymentId: number | string): Promise<Payment> {
  const response = await apiClient.get<ApiResponse<Payment>>(`/payments/${paymentId}`);
  return response.data.data;
}

/**
 * Cancel a payment transaction
 * POST /payments/{id}/cancel
 *
 * @param paymentId - Payment ID to cancel
 * @param reason - Optional cancellation reason
 * @returns Cancelled payment info
 */
export async function cancelPayment(
  paymentId: number | string,
  reason?: string
): Promise<Payment> {
  const response = await apiClient.post<ApiResponse<Payment>>(
    `/payments/${paymentId}/cancel`,
    reason ? { reason } : null
  );
  return response.data.data;
}

/**
 * Create a VietQR payment link
 * POST /payments/vietqr/create-embedded-payment-link
 *
 * @param paymentData - Payment details
 * @returns VietQR payment info including QR code string
 */
export async function createVietQRPayment(
  paymentData: CreatePaymentRequest
): Promise<VietQRResponse> {
  const response = await apiClient.post<any>(
    "/payments/vietqr/create-embedded-payment-link",
    paymentData
  );
  // Handle potential wrapper or direct response
  return response.data.data || response.data;
}

/**
 * Check PayOS payment status via backend proxy
 * GET /payments/vietqr/payment-requests/{id}
 *
 * @param paymentLinkId - Payment Link ID or Order Code
 * @returns Payment status details
 */
export async function checkPayOSPaymentStatus(
  paymentLinkId: string | number
): Promise<PayOSPaymentStatus> {
  const response = await apiClient.get<PayOSPaymentStatus>(
    `/payments/vietqr/payment-requests/${paymentLinkId}`
  );
  return response.data;
}

// Export as default object
const paymentService = {
  createPayment,
  capturePayment,
  getPayment,
  cancelPayment,
  createVietQRPayment,
  checkPayOSPaymentStatus,
};

export default paymentService;
