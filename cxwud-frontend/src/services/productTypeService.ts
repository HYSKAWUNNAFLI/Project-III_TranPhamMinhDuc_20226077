import { apiClient } from "./api";

export interface ProductType {
  id: number;
  code: string;
  attributes: TypeAttribute[];
}

export interface TypeAttribute {
  id?: number;
  key: string;
  label: string;
  dataType: string;
  isRequired: boolean;
}

export interface CreateProductTypeRequest {
  code: string;
  attributes: TypeAttributeRequest[];
}

export interface TypeAttributeRequest {
  key: string;
  label: string;
  dataType: string;
  isRequired: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getAllProductTypes(): Promise<ProductType[]> {
  try {
    const response =
      await apiClient.get<ApiResponse<ProductType[]>>("/product-types");
    return response.data.data || [];
  } catch (error) {
    console.error("Failed to fetch product types:", error);
    throw error;
  }
}

export async function getProductTypeByCode(code: string): Promise<ProductType> {
  try {
    const response = await apiClient.get<ApiResponse<ProductType>>(
      `/product-types/${code}`,
    );
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch product type ${code}:`, error);
    throw error;
  }
}

export async function createProductType(
  request: CreateProductTypeRequest,
): Promise<ProductType> {
  try {
    const response = await apiClient.post<ApiResponse<ProductType>>(
      "/product-types",
      request,
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to create product type:", error);
    throw error;
  }
}

export async function updateProductType(
  code: string,
  request: { code: string },
): Promise<ProductType> {
  try {
    const response = await apiClient.put<ApiResponse<ProductType>>(
      `/product-types/${code}`,
      request,
    );
    return response.data.data;
  } catch (error) {
    console.error(`Failed to update product type ${code}:`, error);
    throw error;
  }
}

export async function deleteProductType(code: string): Promise<void> {
  try {
    await apiClient.delete(`/product-types/${code}`);
  } catch (error) {
    console.error(`Failed to delete product type ${code}:`, error);
    throw error;
  }
}

export async function addAttribute(
  code: string,
  request: TypeAttributeRequest,
): Promise<TypeAttribute> {
  try {
    const response = await apiClient.post<ApiResponse<TypeAttribute>>(
      `/product-types/${code}/attributes`,
      request,
    );
    return response.data.data;
  } catch (error) {
    console.error(`Failed to add attribute to ${code}:`, error);
    throw error;
  }
}

export async function updateAttribute(
  code: string,
  attributeKey: string,
  request: TypeAttributeRequest,
): Promise<TypeAttribute> {
  try {
    const response = await apiClient.put<ApiResponse<TypeAttribute>>(
      `/product-types/${code}/attributes/${attributeKey}`,
      request,
    );
    return response.data.data;
  } catch (error) {
    console.error(
      `Failed to update attribute ${attributeKey} on ${code}:`,
      error,
    );
    throw error;
  }
}

export async function deleteAttribute(
  code: string,
  attributeKey: string,
): Promise<void> {
  try {
    await apiClient.delete(`/product-types/${code}/attributes/${attributeKey}`);
  } catch (error) {
    console.error(
      `Failed to delete attribute ${attributeKey} from ${code}:`,
      error,
    );
    throw error;
  }
}

const productTypeService = {
  getAllProductTypes,
  getProductTypeByCode,
  createProductType,
  updateProductType,
  deleteProductType,
  addAttribute,
  updateAttribute,
  deleteAttribute,
};

export default productTypeService;
