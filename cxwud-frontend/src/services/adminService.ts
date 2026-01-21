import { apiClient } from "./api";
import type { Paginated, Product } from "../types";

/**
 * Admin-related types
 */
export interface User {
  id: number;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  roles: string[];
}

export interface CreateProductRequest {
  productType: "BOOK" | "CD" | "DVD" | "NEWSPAPER";
  status: "ACTIVE" | "INACTIVE";
  barcode: string;
  title: string;
  category: string;
  conditionLabel?: string;
  dominantColor?: string;
  returnPolicy?: string;
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  originalValue: number;
  currentPrice: number;
  stock: number;
  // Product-specific details (add based on product type)
  bookDetail?: any;
  cdDetail?: any;
  dvdDetail?: any;
  newspaperDetail?: any;
}

/**
 * USER MANAGEMENT
 */

/**
 * Handle API responses that may be wrapped in ApiResponse
 */
function handleResponse<T>(response: any): T {
  console.log("API Response:", response);
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  return response.data;
}

/**
 * Create a new user (admin only)
 * POST /admin/users
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  console.log("Creating user:", userData);
  const response = await apiClient.post<any>("/admin/users", userData);
  return handleResponse<User>(response);
}

/**
 * List all users with pagination
 * GET /admin/users?page={page}&size={size}
 */
export async function listUsers(page = 0, size = 20): Promise<Paginated<User>> {
  console.log(`Listing users page=${page} size=${size}`);
  const response = await apiClient.get<any>("/admin/users", {
    params: { page, size },
  });
  return handleResponse<Paginated<User>>(response);
}

/**
 * Get user by ID
 * GET /admin/users/{id}
 */
export async function getUser(userId: number | string): Promise<User> {
  const response = await apiClient.get<any>(`/admin/users/${userId}`);
  return handleResponse<User>(response);
}

/**
 * Update user (if backend supports)
 * PUT /admin/users/{id}
 */
export async function updateUser(
  userId: number | string,
  userData: Partial<CreateUserRequest>
): Promise<User> {
  console.log(`Updating user ${userId}:`, userData);
  const response = await apiClient.put<any>(
    `/admin/users/${userId}`,
    userData
  );
  return handleResponse<User>(response);
}

/**
 * Delete user (if backend supports)
 * DELETE /admin/users/{id}
 */
export async function deleteUser(userId: number | string): Promise<void> {
  const response = await apiClient.delete<any>(`/admin/users/${userId}`);
  return handleResponse<void>(response);
}

/**
 * Lock user account
 * POST /admin/users/{id}/lock
 */
export async function lockUser(userId: number | string): Promise<User> {
  const response = await apiClient.post<any>(`/admin/users/${userId}/lock`);
  return handleResponse<User>(response);
}

/**
 * Unlock user account
 * POST /admin/users/{id}/unlock
 */
export async function unlockUser(userId: number | string): Promise<User> {
  const response = await apiClient.post<any>(`/admin/users/${userId}/unlock`);
  return handleResponse<User>(response);
}

/**
 * Update user roles
 * PUT /admin/users/{id}/roles
 */
export async function updateUserRoles(
  userId: number | string,
  roles: string[]
): Promise<User> {
  const response = await apiClient.put<any>(`/admin/users/${userId}/roles`, { roles });
  return handleResponse<User>(response);
}

/**
 * PRODUCT MANAGEMENT
 */

/**
 * Create a new product (admin only)
 * POST /admin/products
 *
 * @param productData - Product details
 * @returns Created product
 *
 * @example
 * const product = await adminService.createProduct({
 *   productType: 'BOOK',
 *   status: 'ACTIVE',
 *   barcode: '1234567890123',
 *   title: 'Sample Book',
 *   category: 'Books',
 *   conditionLabel: 'New',
 *   dominantColor: 'Blue',
 *   returnPolicy: '30 days',
 *   height: 20.0,
 *   width: 13.0,
 *   length: 2.0,
 *   weight: 0.5,
 *   originalValue: 25.00,
 *   currentPrice: 20.00,
 *   stock: 100,
 *   bookDetail: null
 * });
 */
export async function createProduct(
  productData: CreateProductRequest
): Promise<Product> {
  const response = await apiClient.post<Product>(
    "/admin/products",
    productData
  );
  return response.data;
}

/**
 * Update product (if backend supports)
 * PUT /admin/products/{id}
 *
 * @param productId - Product ID
 * @param productData - Updated product data
 * @returns Updated product
 */
export async function updateProduct(
  productId: number | string,
  productData: Partial<CreateProductRequest>
): Promise<Product> {
  const response = await apiClient.put<Product>(
    `/admin/products/${productId}`,
    productData
  );
  return response.data;
}

/**
 * Delete product (if backend supports)
 * DELETE /admin/products/{id}
 *
 * @param productId - Product ID to delete
 */
export async function deleteProduct(productId: number | string): Promise<void> {
  await apiClient.delete(`/admin/products/${productId}`);
}

// Export as default object
const adminService = {
  // User management
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  lockUser,
  unlockUser,
  updateUserRoles,
  // Product management
  createProduct,
  updateProduct,
  deleteProduct,
};

export default adminService;

