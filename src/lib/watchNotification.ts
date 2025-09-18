import { Db, ChangeStream, ChangeStreamDocument } from "mongodb";
import { Server as IOServer } from "socket.io";
import { connectToDatabase } from "@/lib/mongodb"; // adjust path to your connectToDatabase

interface Notification {
  _id: string;
  type: string;
  data: string; // Now a string instead of an object
  createdAt: Date;
  expiresAt: Date;
  read: boolean;
}

let changeStream: ChangeStream<Notification> | null = null;

export async function startNotificationWatcher(io: IOServer): Promise<void> {
  if (changeStream) return; // already watching

  const db: Db = await connectToDatabase();
  const collection = db.collection<Notification>("notifications");

  console.log("👀 Watching notifications collection...");

  changeStream = collection.watch([
    { $match: { operationType: "insert" } }
  ]);

  changeStream.on("change", (change: ChangeStreamDocument<Notification>) => {
    if (change.operationType === "insert" && "fullDocument" in change) {
      const notification = (change as ChangeStreamDocument<Notification> & { fullDocument: Notification }).fullDocument;
      if (notification) {
        console.log("📨 New notification:", notification);
        io.emit("notification", notification);
      }
    }
  });

  changeStream.on("error", (err) => {
    console.error("❌ Change Stream Error:", err);
  });
}
