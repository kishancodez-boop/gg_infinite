import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import {
  JOB_EMPLOYMENT_TYPES,
  JOB_EXPERIENCE_LEVELS,
  JOB_ROLE_CATEGORIES,
  VERIFICATION_STATUSES,
} from '../types/domain.js';

const greenJobListingSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: 250,
    },
    organization: {
      type: String,
      required: [true, 'organization is required'],
      trim: true,
      maxlength: 200,
    },
    location: {
      type: String,
      required: [true, 'location is required'],
      trim: true,
      maxlength: 160,
    },
    stateOrRegion: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    roleCategory: {
      type: String,
      required: true,
      enum: JOB_ROLE_CATEGORIES,
      default: 'other',
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: JOB_EXPERIENCE_LEVELS,
      default: 'mid',
    },
    employmentType: {
      type: String,
      required: true,
      enum: JOB_EMPLOYMENT_TYPES,
      default: 'full_time',
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
      maxlength: 3000,
    },
    officialSourceUrl: {
      type: String,
      required: [true, 'officialSourceUrl is required'],
      trim: true,
      maxlength: 500,
    },
    postingStatusNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default:
        'Verify live vacancy status directly on the official employer or portal URL before applying.',
    },
    sourceRef: {
      type: Schema.Types.ObjectId,
      ref: 'DataSource',
      default: null,
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: VERIFICATION_STATUSES,
      default: 'unverified',
    },
    isDemoData: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'green_job_listings',
  }
);

greenJobListingSchema.index({ isDemoData: 1, roleCategory: 1, experienceLevel: 1 });
greenJobListingSchema.index({ location: 1, employmentType: 1 });
greenJobListingSchema.index({ lastVerifiedAt: -1 });

export type GreenJobListingDocument = InferSchemaType<typeof greenJobListingSchema>;

export const GreenJobListingModel =
  (mongoose.models.GreenJobListing as mongoose.Model<GreenJobListingDocument>) ||
  mongoose.model<GreenJobListingDocument>('GreenJobListing', greenJobListingSchema);

