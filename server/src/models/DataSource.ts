import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import {
  ACCESS_METHODS,
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
    sourceType: {
      type: String,
      required: true,
      enum: SOURCE_TYPES,
    },
    accessMethod: {
      type: String,
      required: true,
      enum: ACCESS_METHODS,
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: VERIFICATION_STATUSES,
      default: 'unverified',
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
dataSourceSchema.index({ isDemoData: 1, verificationStatus: 1 });

export type DataSourceDocument = InferSchemaType<typeof dataSourceSchema>;

export const DataSourceModel =
  (mongoose.models.DataSource as mongoose.Model<DataSourceDocument>) ||
  mongoose.model<DataSourceDocument>('DataSource', dataSourceSchema);

