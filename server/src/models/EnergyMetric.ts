import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import {
  ACCESS_METHODS,
  GEOGRAPHIC_SCOPES,
  VERIFICATION_STATUSES,
} from '../types/domain.js';

const metricProvenanceSchema = new Schema(
  {
    originalSource: {
      type: String,
      required: [true, 'provenance.originalSource is required'],
      trim: true,
    },
    sourceUrl: {
      type: String,
      required: [true, 'provenance.sourceUrl is required'],
      trim: true,
      validate: {
        validator: (value: string) => /^https?:\/\/.+/.test(value),
        message: 'provenance.sourceUrl must start with http:// or https://',
      },
    },
    retrievedAt: {
      type: Date,
      required: [true, 'provenance.retrievedAt is required'],
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    extractionMethod: {
      type: String,
      required: true,
      enum: ACCESS_METHODS,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.5,
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: VERIFICATION_STATUSES,
      default: 'unverified',
    },
  },
  { _id: false }
);

const energyMetricSchema = new Schema(
  {
    metricName: {
      type: String,
      required: [true, 'metricName is required'],
      trim: true,
      maxlength: 200,
    },
    value: {
      type: Number,
      required: [true, 'value is required'],
      validate: {
        validator: (val: number) => Number.isFinite(val),
        message: 'value must be a finite number',
      },
    },
    unit: {
      type: String,
      required: [true, 'unit is required'],
      trim: true,
      maxlength: 50,
    },
    geographicScope: {
      type: String,
      required: true,
      enum: GEOGRAPHIC_SCOPES,
    },
    stateOrRegion: {
      type: String,
      required: [true, 'stateOrRegion is required'],
      trim: true,
      maxlength: 120,
    },
    observationDate: {
      type: Date,
      required: [true, 'observationDate is required'],
    },
    sourceRef: {
      type: Schema.Types.ObjectId,
      ref: 'DataSource',
      required: [true, 'sourceRef is required'],
    },
    provenance: {
      type: metricProvenanceSchema,
      required: [true, 'provenance is required'],
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

energyMetricSchema.index({ geographicScope: 1, stateOrRegion: 1, observationDate: -1 });
energyMetricSchema.index({ metricName: 1, observationDate: -1 });
energyMetricSchema.index({ isDemoData: 1, 'provenance.verificationStatus': 1 });

export type EnergyMetricDocument = InferSchemaType<typeof energyMetricSchema>;

export const EnergyMetricModel =
  (mongoose.models.EnergyMetric as mongoose.Model<EnergyMetricDocument>) ||
  mongoose.model<EnergyMetricDocument>('EnergyMetric', energyMetricSchema);

