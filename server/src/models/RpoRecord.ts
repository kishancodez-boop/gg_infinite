import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { RPO_CATEGORIES, VERIFICATION_STATUSES } from '../types/domain.js';

const rpoRecordSchema = new Schema(
  {
    stateOrOrganization: {
      type: String,
      required: [true, 'stateOrOrganization is required'],
      trim: true,
      maxlength: 200,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['state', 'discom', 'utility', 'other'],
      default: 'state',
    },
    compliancePeriod: {
      type: String,
      required: [true, 'compliancePeriod is required'],
      trim: true,
      maxlength: 60,
    },
    category: {
      type: String,
      required: true,
      enum: RPO_CATEGORIES,
      default: 'total',
    },
    targetPercentage: {
      type: Number,
      required: [true, 'targetPercentage is required'],
      min: [0, 'targetPercentage cannot be negative'],
      max: [100, 'targetPercentage cannot exceed 100'],
    },
    reportedPercentage: {
      type: Number,
      default: null,
      min: [0, 'reportedPercentage cannot be negative'],
      max: [100, 'reportedPercentage cannot exceed 100'],
    },
    sourceRef: {
      type: Schema.Types.ObjectId,
      ref: 'DataSource',
      required: [true, 'sourceRef is required'],
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
  },
  {
    timestamps: true,
  }
);

rpoRecordSchema.index(
  { stateOrOrganization: 1, compliancePeriod: 1, category: 1, isDemoData: 1 },
  { unique: true }
);
rpoRecordSchema.index({ isDemoData: 1, verificationStatus: 1 });

export type RpoRecordDocument = InferSchemaType<typeof rpoRecordSchema>;

export const RpoRecordModel =
  (mongoose.models.RpoRecord as mongoose.Model<RpoRecordDocument>) ||
  mongoose.model<RpoRecordDocument>('RpoRecord', rpoRecordSchema);

