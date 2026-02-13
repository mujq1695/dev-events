import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, 'Overview is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      enum: ['online', 'offline', 'hybrid'],
    },
    audience: {
      type: String,
      required: [true, 'Audience is required'],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, 'Agenda is required'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'Agenda must have at least one item',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'Tags must have at least one item',
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

/**
 * Generates a URL-friendly slug from a title.
 * Converts to lowercase, replaces spaces with hyphens, removes special characters.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove consecutive hyphens
}

/**
 * Normalizes date string to ISO format (YYYY-MM-DD).
 * Throws error if date is invalid.
 */
function normalizeDateToISO(dateStr: string): string {
  let parsed: Date;

  // Detect ISO date-only format (e.g. "2024-05-20") to prevent timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    parsed = new Date(Date.UTC(year, month - 1, day));
  } else {
    parsed = new Date(dateStr);
  }

  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return parsed.toISOString().split('T')[0];
}

/**
 * Normalizes time to 24-hour format (HH:MM).
 * Supports common formats like "2:30 PM", "14:30", "2:30pm".
 */
function normalizeTime(timeStr: string): string {
  const trimmed = timeStr.trim().toUpperCase();

  // Check if already in 24-hour format (HH:MM)
  const time24Match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (time24Match) {
    const hours = parseInt(time24Match[1], 10);
    const minutes = time24Match[2];
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  // Parse 12-hour format with AM/PM
  const time12Match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (time12Match) {
    let hours = parseInt(time12Match[1], 10);
    const minutes = time12Match[2];
    const period = time12Match[3];

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  throw new Error(`Invalid time format: ${timeStr}`);
}

// Pre-save hook: generates slug, normalizes date/time, validates required fields
EventSchema.pre('save', async function (next) {
  try {
    // Regenerate slug only if title is new or modified
    if (this.isNew || this.isModified('title')) {
      let baseSlug = generateSlug(this.title);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug uniqueness by appending counter if needed
      const EventModel = this.constructor as Model<IEvent>;
      while (await EventModel.exists({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      this.slug = slug;
    }

    // Normalize date to ISO format
    if (this.isNew || this.isModified('date')) {
      this.date = normalizeDateToISO(this.date);
    }

    // Normalize time to consistent 24-hour format
    if (this.isNew || this.isModified('time')) {
      this.time = normalizeTime(this.time);
    }

    // Validate required string fields are non-empty
    const requiredFields: (keyof IEvent)[] = [
      'title',
      'description',
      'overview',
      'image',
      'venue',
      'location',
      'date',
      'time',
      'mode',
      'audience',
      'organizer',
    ];

    for (const field of requiredFields) {
      const value = this[field];
      if (typeof value === 'string' && value.trim() === '') {
        throw new Error(`${field} cannot be empty`);
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Prevent model recompilation in development (Next.js hot reload)
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
