import api from "../axios"

export type Batch = {
  _id?: string
  batchCode: string
  quantity: number
  mfg_date: string
  shelf_life_days: number
  productId?: string
}

export const getAllBatches = async (productId?: string) => {
  const url = productId ? `/api/batches?productId=${productId}` : "/api/batches"
  const res = await api.get(url)
  return res.data
}

export const createBatch = async (batchData: Batch & { productId: string }) => {
  const res = await api.post("/api/batches", batchData)
  return res.data
}

export const updateBatch = async (
  productId: string,
  batchId: string,
  updateData: Partial<Batch>
) => {
  const res = await api.put("/api/batches", { productId, batchId, ...updateData })
  return res.data
}

export const deleteBatch = async (productId: string, batchId: string) => {
  const res = await api.delete("/api/batches", { data: { productId, batchId } })
  return res.data
}
