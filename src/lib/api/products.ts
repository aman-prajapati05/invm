import api from "../axios";

// Product type
export type Product = {
  _id?: string;
  name: string;
  sku: string;
  brand?: string;
  shelf_life_days: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Get all products
export const getAllProducts = async () => {
  const res = await api.get("/api/products");
  return res.data;
};

// Get product by id
export const getProductById = async (id: string) => {
  const res = await api.get(`/api/products?id=${id}`);
  return res.data;
};

// Create product
export const createProduct = async (productData: Product) => {
  const res = await api.post("/api/products", productData);
  return res.data;
};

// Update product
export const updateProduct = async (id: string, updateData: Partial<Product>) => {
  const res = await api.put("/api/products", { id, ...updateData });
  return res.data;
};

// Delete product
export const deleteProduct = async (id: string) => {
  const res = await api.delete("/api/products", { data: { id } });
  return res.data;
};

// Search products (optional, by name or SKU)
export const searchProducts = async (query: string) => {
  const res = await api.get(`/api/products/search?query=${encodeURIComponent(query)}`);
  return res.data;
};
