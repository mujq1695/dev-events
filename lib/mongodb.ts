import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

/**
 * Cached connection interface for development hot-reloading.
 * In development, Next.js clears the Node.js cache on every request,
 * which would create new database connections on each reload.
 */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Extend the global object to include our mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Use cached connection in development to prevent connection leaks
const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connects to MongoDB using Mongoose with connection caching.
 * Returns the cached connection if available, otherwise creates a new one.
 */
async function connectToDatabase(): Promise<Mongoose> {
  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if not already pending
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false, // Disable command buffering for better error handling
    });
  }

  // Await and cache the connection
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
