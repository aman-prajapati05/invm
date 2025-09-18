// lib/jobScheduler.ts
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

type Job = {
  _id?: ObjectId
  batchId: ObjectId
  productId: ObjectId
  type: "expiry-reminder"
  notifyAt: Date
  expiryDate: Date
  status: "scheduled" | "cancelled" | "done"
  createdAt: Date
}

const activeTimers: Record<string, NodeJS.Timeout> = {}

export async function scheduleJobsOnStartup() {
  const db = await connectToDatabase()
  const jobsCollection = db.collection<Job>("jobs")

  const jobs = await jobsCollection
    .find({ status: "scheduled", notifyAt: { $gte: new Date() } })
    .toArray()

  for (const job of jobs) {
    scheduleJob(job)
  }
}

export function scheduleJob(job: Job) {
  const now = Date.now()
  const delay = new Date(job.notifyAt).getTime() - now

  if (delay <= 0) {
    console.log("Job notifyAt is in the past, marking done:", job._id)
    runJob(job)
    return
  }

  const timer = setTimeout(() => runJob(job), delay)
  activeTimers[job.batchId.toString()] = timer
  console.log(`Scheduled job for batch ${job.batchId} at ${job.notifyAt}`)
}

async function runJob(job: Job) {
  console.log(`🚨 Reminder: Batch ${job.batchId} is expiring in 5 days!`)

  const db = await connectToDatabase()
  const jobsCollection = db.collection<Job>("jobs")

  await jobsCollection.updateOne(
    { _id: job._id },
    { $set: { status: "done", executedAt: new Date() } }
  )

  delete activeTimers[job.batchId.toString()]
}

// Cancel job when batch is deleted or updated
export function cancelJob(batchId: ObjectId) {
  const key = batchId.toString()
  if (activeTimers[key]) {
    clearTimeout(activeTimers[key]!)
    delete activeTimers[key]
    console.log(`Cancelled job for batch ${batchId}`)
  }
}
