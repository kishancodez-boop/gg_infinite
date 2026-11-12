import mongoose, { Schema, type InferSchemaType, type Types } from 'mongoose';
import {
  CHANGE_TYPES,
  GEOGRAPHIC_SCOPES,
  REVIEW_STATUSES,
  VERIFICATION_STATUSES,
} from '../types/domain.js';

const proposedMetricSchema = new Schema(
  {
    metricName: { type: String, required: true, trim: true, maxlength: 160 },
    value: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, maxlength: 40 },
    geographicScope: {
      type: String,
      required: true,
      enum: GEOGRAPHIC_SCOPES,
    },
    stateOrRegion: { type: String, required: true, trim: true, maxlength: 120 },
    observationDate: { type: Date, required: true },
  },
  { _id: false }
);

const stagedProvenanceSchema = new Schema(
  {
    sourceUrl: { type: String, required: true, trim: true, maxlength: 500 },
    retrievedAt: { type: Date, required: true },
    publishedAt: { type: Date, default: null },
    extractionMethod: { type: String, required: true, trim: true, maxlength: 80 },
    verificationStatus: {
      type: String,
      required: true,
      enum: VERIFICATION_STATUSES,
      default: 'unverified',
    },
    confidence: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    notes: { type: String, trim: true, maxlength: 600, default: '' },
  },
  { _id: false }
);

const stagedRecordSchema = new Schema(
  {
    sourceRef: {
      type: Schema.Types.ObjectId,
      ref: 'DataSource',
      required: true,
      index: true,
    },
    ingestionRunRef: {
      type: Schema.Types.ObjectId,
      ref: 'IngestionRun',
      required: true,
      index: true,
    },
    naturalKey: { type: String, required: true, trim: true, maxlength: 240, index: true },
    contentHash: { type: String, required: true, trim: true, maxlength: 128 },
    changeType: {
      type: String,
      required: true,
      enum: CHANGE_TYPES,
      default: 'new',
    },
    changeSummary: { type: String, trim: true, maxlength: 500, default: '' },
    proposedData: { type: proposedMetricSchema, required: true },
    provenance: { type: stagedProvenanceSchema, required: true },
    reviewStatus: {
      type: String,
      required: true,
      enum: REVIEW_STATUSES,
      default: 'pending_review',
      index: true,
    },
    reviewNotes: { type: String, trim: true, maxlength: 600, default: '' },
    reviewedBy: { type: String, trim: true, maxlength: 120, default: '' },
    reviewedAt: { type: Date, default: null },
    publishedRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'EnergyMetric',
      default: null,
    },
    publishedAt: { type: Date, default: null },
    isDemoData: { type: Boolean, required: true, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

stagedRecordSchema.index({ naturalKey: 1, reviewStatus: 1 });
stagedRecordSchema.index({ createdAt: -1 });

export type StagedRecord = InferSchemaType<typeof stagedRecordSchema>;
export type StagedRecordDocument = mongoose.HydratedDocument<StagedRecord> & {
  _id: Types.ObjectId;
};

export const StagedRecordModel =
  (mongoose.models.StagedRecord as mongoose.Model<StagedRecord>) ||
  mongoose.model<StagedRecord>('StagedRecord', stagedRecordSchema);

