import mongoose, { Mongoose } from "mongoose";

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
  var mongooseCache: MongooseCache | undefined;
}

// Use cached connection in development to prevent connection leaks
const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB using Mongoose with connection caching.
 * Returns the cached connection if available, otherwise creates a new one.
 * Throws if MONGODB_URI environment variable is not defined.
 */
async function connectToDatabase(): Promise<Mongoose> {
 

  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if not already pending
  if (!cached.promise) {
        
         // Validate MONGODB_URI at connection time, not module load
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is not defined. " +
      "Please add it to your .env.local file."
    );
  }
        
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false, // Disable command buffering for better error handling
    });
  }

  // Await and cache the connection
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Allow retry on failure
    throw error;
  }
}

export default connectToDatabase;
