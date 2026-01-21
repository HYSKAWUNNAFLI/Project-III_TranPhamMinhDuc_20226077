import { apiClient } from "./api";

/**
 * Product Manager Service
 * Handles all PM-related API calls for product and order management
 */

// Types
export interface ProductFilterRequest {
  page?: number;
  size?: number;
  typeCode?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
}

export interface ProductRequest {
  typeCode: string;
  status?: "ACTIVE" | "INACTIVE";
  barcode: string;
  imageUrl?: string;
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
  attributes?: Record<string, any>;
}

export interface BulkDeleteRequest {
  productIds: number[];
}

export interface BulkDeleteResponse {
  deletedCount: number;
  deactivatedCount: number;
  failedIds: number[];
  message?: string;
}

// Helper to handle ApiResponse wrapper
function handleResponse<T>(response: any): T {
  console.log("PM API Response:", response);
  // If response.data (axios) has data (ApiResponse) property
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  // If wrapped in ApiResponse structure but directly in response (rare with axios)
  if (response.success && response.data) {
    return response.data;
  }
  // Fallback: return data directly
  return response.data;
}

// Product Management APIs
export async function listProducts(
  filter: ProductFilterRequest = {},
): Promise<any> {
  console.log("Listing products with filter:", filter);
  const response = await apiClient.get("/pm/products", { params: filter });
  return handleResponse(response);
}

export async function getProduct(productId: number): Promise<any> {
  const response = await apiClient.get(`/pm/products/${productId}`);
  return handleResponse(response);
}

export async function createProduct(formData: FormData): Promise<any> {
  const response = await apiClient.post("/pm/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return handleResponse(response);
}

export async function updateProduct(
  productId: number,
  formData: FormData,
): Promise<any> {
  const response = await apiClient.put(`/pm/products/${productId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return handleResponse(response);
}

export async function deleteProduct(productId: number): Promise<any> {
  const response = await apiClient.delete(`/pm/products/${productId}`);
  return handleResponse(response);
}

export async function bulkDeleteProducts(
  productIds: number[],
): Promise<BulkDeleteResponse> {
  const response = await apiClient.post("/pm/products/bulk-delete", {
    productIds,
  });
  return handleResponse<BulkDeleteResponse>(response);
}


const pmService = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
};

export default pmService;
