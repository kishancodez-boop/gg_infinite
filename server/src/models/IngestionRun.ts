import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { INGESTION_MODES, INGESTION_STATUSES } from '../types/domain.js';

const validationErrorItemSchema = new Schema(
  {
    rowIndex: { type: Number, required: true, min: 0 },
    field: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 400 },
  },
  { _id: false }
);

const ingestionRunSchema = new Schema(
  {
    sourceRef: {
      type: Schema.Types.ObjectId,
      ref: 'DataSource',
      required: [true, 'sourceRef is required'],
    },
    startedAt: {
      type: Date,
      required: [true, 'startedAt is required'],
    },
    endedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: INGESTION_STATUSES,
      default: 'dry_run',
    },
    recordsProcessed: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    recordsAccepted: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    recordsRejected: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    errorSummary: {
      type: String,
      trim: true,
      default: null,
    },
    isDryRun: {
      type: Boolean,
      required: true,
      default: false,
    },
    sourceMode: {
      type: String,
      required: true,
      enum: INGESTION_MODES,
      default: 'fixture',
    },
    fixtureLabel: {
      type: String,
      trim: true,
      default: null,
    },
    recordsDuplicate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    recordsChanged: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    validationErrors: {
      type: [validationErrorItemSchema],
      default: [],
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

ingestionRunSchema.pre('validate', function validateRecordCounts(next) {
  if (this.recordsAccepted + this.recordsRejected > this.recordsProcessed) {
    next(
      new Error('recordsAccepted + recordsRejected cannot exceed recordsProcessed')
    );
    return;
  }
  if (this.endedAt && this.endedAt < this.startedAt) {
    next(new Error('endedAt cannot be earlier than startedAt'));
    return;
  }
  next();
});

ingestionRunSchema.index({ sourceRef: 1, startedAt: -1 });
ingestionRunSchema.index({ status: 1, isDemoData: 1 });

export type IngestionRunDocument = InferSchemaType<typeof ingestionRunSchema>;

export const IngestionRunModel =
  (mongoose.models.IngestionRun as mongoose.Model<IngestionRunDocument>) ||
  mongoose.model<IngestionRunDocument>('IngestionRun', ingestionRunSchema);

