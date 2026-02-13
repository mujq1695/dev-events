import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import Event, { IEvent } from './event.model';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Email validation regex pattern (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true, // Index for faster event-based queries
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (email: string) => EMAIL_REGEX.test(email),
        message: 'Invalid email format',
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Pre-save hook: validates that referenced event exists
BookingSchema.pre('save', async function (next) {
  try {
    // Validate email format (additional runtime check)
    if (!EMAIL_REGEX.test(this.email)) {
      throw new Error(`Invalid email format: ${this.email}`);
    }

    // Verify the referenced event exists in the database
    // This prevents bookings for non-existent or deleted events
    const eventExists = await Event.exists({ _id: this.eventId });
    if (!eventExists) {
      throw new Error(`Event with ID ${this.eventId} does not exist`);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Prevent model recompilation in development (Next.js hot reload)
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
