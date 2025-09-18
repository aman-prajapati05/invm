import api from "../axios"

export type Sale = {
  _id?: string
  productId: string
  batchId: string
  productName: string
  batchCode: string
  quantitySold: number
  saleDate: string
  createdAt?: string
}

export const getAllSales = async () => {
  const res = await api.get("/api/sales")
  return res.data
}

export const createSale = async (saleData: Sale) => {
  const res = await api.post("/api/sales", saleData)
  return res.data
}

export const updateSale = async (id: string, updateData: Partial<Sale>) => {
  const res = await api.put("/api/sales", { id, ...updateData })
  return res.data
}

export const deleteSale = async (id: string) => {
  const res = await api.delete("/api/sales", { data: { id } })
  return res.data
}
