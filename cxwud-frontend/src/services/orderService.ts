import { apiClient } from "./api";

/**
 * Order-related types
 */
export interface OrderItem {
  productId: number;
  productTitle: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  customerEmail: string;
  customerName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  cartSessionKey?: string;
  shippingFee: number;
  items: OrderItem[];
  cancelReturnUrl?: string; // New field
  successReturnUrl?: string; // New field
  currency?: string; // New field
  provider?: string; // New field
}

export interface UpdateDeliveryInfoRequest {
  customerEmail: string;
  customerName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  provider?: string;
  currency?: string;
  successReturnUrl?: string;
  cancelReturnUrl?: string;
}

export type PaymentStatus =
  | "PENDING"
  | "SUCCESSFULL"
  | "FAILED";

export interface PaymentResultResponse {
  transactionId: number;
  status: PaymentStatus;
  approvalUrl?: string;
  captureUrl?: string;
  qrContent?: string;
  providerReference?: string;
}

export interface Order {
  id: number;
  orderNumber?: string;
  customerEmail: string;
  customerName: string;
  phone: string;
  addressLine: string;
  city?: string;
  province: string;
  postalCode?: string;
  shippingFee: number;
  totalBeforeVat?: number;
  totalWithVat?: number;
  subtotal?: number;
  total?: number;
  status?: string;
  items: OrderItem[];
  createdAt?: string;
  paymentMinutes?: number;
  updatedAt?: string;
  expiresAt?: string;
  paymentResult?: PaymentResultResponse;
}

export interface OrderResponse {
  order?: Order;
  message?: string;
  orderId?: number;
}

/**
 * Create a new order
 * POST /orders
 *
 * @param orderData - Order details including customer info and items
 * @returns Created order with ID
 *
 * @example
 * const order = await orderService.createOrder({
 *   customerEmail: 'buyer@example.com',
 *   customerName: 'John Doe',
 *   phone: '0123456789',
 *   addressLine: '123 Main St',
 *   city: 'Hanoi',
 *   province: 'HN',
 *   postalCode: '100000',
 *   shippingFee: 2.50,
 *   items: [
 *     { productId: 1, productTitle: 'Book', quantity: 2, price: 20.00 }
 *   ]
 * });
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Create a new order
 * POST /orders
 *
 * @param orderData - Order details including customer info and items
 * @returns Created order with ID
 *
 * @example
 * const order = await orderService.createOrder({
 *   customerEmail: 'buyer@example.com',
 *   customerName: 'John Doe',
 *   phone: '0123456789',
 *   addressLine: '123 Main St',
 *   city: 'Hanoi',
 *   province: 'HN',
 *   postalCode: '100000',
 *   shippingFee: 2.50,
 *   items: [
 *     { productId: 1, productTitle: 'Book', quantity: 2, price: 20.00 }
 *   ]
 * });
 */
export async function createOrder(
  orderData: CreateOrderRequest,
): Promise<Order> {
  const response = await apiClient.post<ApiResponse<Order>>(
    "/orders",
    orderData,
  );
  return response.data.data;
}

/**
 * Get order by ID
 * GET /orders/{id}
 *
 * @param orderId - Order ID
 * @returns Order details
 *
 * @example
 * const order = await orderService.getOrder(123);
 */
export async function getOrder(orderId: number | string): Promise<Order> {
  const response = await apiClient.get<ApiResponse<Order>>(
    `/orders/${orderId}`,
  );
  return response.data.data;
}

/**
 * Cancel an order
 * POST /orders/{id}/cancel
 *
 * @param orderId - Order ID to cancel
 * @returns Cancelled order or confirmation
 *
 * @example
 * await orderService.cancelOrder(123);
 */
export async function cancelOrder(
  orderId: number | string,
): Promise<Order | void> {
  const response = await apiClient.post<ApiResponse<Order>>(
    `/orders/${orderId}/cancel`,
  );
  return response.data.data;
}

/**
 * Get user's order history (if backend supports it)
 * This endpoint may need to be added to your backend
 * GET /orders?userId={userId} or GET /orders/my-orders
 *
 * @param userId - Optional user ID filter
 * @returns List of orders
 */
export async function getOrderHistory(
  userId?: number | string,
): Promise<Order[]> {
  const response = await apiClient.get<Order[]>("/orders", {
    params: userId ? { userId } : undefined,
  });
  return response.data;
}

/**
 * Calculate shipping fee based on delivery info and cart
 * POST /orders/shipping-fee
 *
 * @param data - Delivery details and optionally cart value/weight
 * @returns Shipping fee amount
 */
export async function calculateShippingFee(data: {
  province: string;
  address: string;
  cartValue: number;
  cartSessionKey?: string; // Add this for weight calculation
}): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>(
    "/orders/shipping-fee",
    data,
  );
  return response.data.data;
}

/**
 * Check if order items have changed compared to provided items
 */
export async function checkItemsChanged(
  orderId: number | string,
  items: OrderItem[],
): Promise<boolean> {
  const response = await apiClient.post<ApiResponse<boolean>>(
    `/orders/${orderId}/check-items`,
    items,
  );
  // @ts-ignore
  return response.data.data;
}

/**
 * Terminate an order
 */
export async function terminateOrder(orderId: number | string): Promise<void> {
  await apiClient.post(`/orders/${orderId}/terminate`);
}

/**
 * Check order state to determine if we should create new or reuse existing order
 */
export interface CheckOrderStateRequest {
  sessionKey: string;
  items: OrderItem[];
}

export interface CheckOrderStateResponse {
  action: "CREATE_NEW" | "REUSE";
  orderId?: number;
  message?: string;
}

export async function checkOrderState(
  sessionKey: string,
  items: OrderItem[],
): Promise<CheckOrderStateResponse> {
  const response = await apiClient.post<ApiResponse<CheckOrderStateResponse>>(
    "/orders/check-order-state",
    { sessionKey, items },
  );
  return response.data.data;
}

/**
 * Update delivery info for an existing order
 */
export async function updateDeliveryInfo(
  orderId: number | string,
  data: UpdateDeliveryInfoRequest,
): Promise<OrderResponse> {
  const response = await apiClient.put<ApiResponse<OrderResponse>>(
    `/orders/${orderId}/delivery-info`,
    data,
  );
  // @ts-ignore
  return response.data.data;
}

// Export as default object
const orderService = {
  createOrder,
  getOrder,
  cancelOrder,
  getOrderHistory,
  calculateShippingFee,
  checkItemsChanged,
  terminateOrder,
  updateDeliveryInfo,
  checkOrderState,
};

export default orderService;
