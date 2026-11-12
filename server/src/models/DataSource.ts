import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import {
  ACCESS_METHODS,
  DATA_CATEGORIES,
  EXPECTED_FORMATS,
  SOURCE_TYPES,
  VERIFICATION_STATUSES,
} from '../types/domain.js';

const httpUrlValidator = {
  validator: (value: string) => /^https?:\/\/.+/.test(value),
  message: 'URL must start with http:// or https://',
};

const dataSourceSchema = new Schema(
  {
    sourceName: {
      type: String,
      required: [true, 'sourceName is required'],
      trim: true,
      maxlength: 200,
    },
    organization: {
      type: String,
      required: [true, 'organization is required'],
      trim: true,
      maxlength: 200,
    },
    sourceUrl: {
      type: String,
      required: [true, 'sourceUrl is required'],
      trim: true,
      validate: httpUrlValidator,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: function defaultDomain(this: { sourceUrl?: string }) {
        try {
          return this.sourceUrl ? new URL(this.sourceUrl).hostname.toLowerCase() : '';
        } catch {
          return '';
        }
      },
    },
    sourceType: {
      type: String,
      required: true,
      enum: SOURCE_TYPES,
    },
    dataCategory: {
      type: String,
      required: true,
      enum: DATA_CATEGORIES,
      default: 'general',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    accessMethod: {
      type: String,
      required: true,
      enum: ACCESS_METHODS,
    },
    expectedFormat: {
      type: String,
      required: true,
      enum: EXPECTED_FORMATS,
      default: 'mixed',
    },
    updateCadence: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'unknown',
    },
    accessNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: VERIFICATION_STATUSES,
      default: 'unverified',
    },
    evidenceNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDemoData: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

dataSourceSchema.index({ sourceUrl: 1 }, { unique: true });
dataSourceSchema.index({ organization: 1, sourceType: 1 });
dataSourceSchema.index({ dataCategory: 1, verificationStatus: 1, active: 1 });
dataSourceSchema.index({ isDemoData: 1, verificationStatus: 1 });

export type DataSourceDocument = InferSchemaType<typeof dataSourceSchema>;

export const DataSourceModel =
  (mongoose.models.DataSource as mongoose.Model<DataSourceDocument>) ||
  mongoose.model<DataSourceDocument>('DataSource', dataSourceSchema);
