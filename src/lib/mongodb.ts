import { MongoClient, MongoClientOptions, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri: string = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect().then(async (client) => {
    const db = client.db();

    // ✅ Ensure TTL index exists on 'createdAt' field for otp_verifications
    try {
      await db.collection('otp_verifications').createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 300 } // auto-delete after 5 minutes
      );
    } catch (err) {
      console.error("⚠️ Failed to create TTL index on otp_verifications:", err);
    }

    return client;
  });
}

clientPromise = global._mongoClientPromise;

/**
 * Connect to the database and return the default DB instance
 */
export async function connectToDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(); // You can specify .db("your-db-name") if needed
}

export default clientPromise;
