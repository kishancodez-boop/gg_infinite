import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import {
  POLICY_CATEGORIES,
  POLICY_RECORD_KINDS,
  VERIFICATION_STATUSES,
} from '../types/domain.js';

const policySchemeSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: 250,
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
      maxlength: 4000,
    },
    issuingOrganization: {
      type: String,
      required: [true, 'issuingOrganization is required'],
      trim: true,
      maxlength: 200,
    },
    recordKind: {
      type: String,
      required: true,
      enum: POLICY_RECORD_KINDS,
      default: 'policy',
    },
    category: {
      type: String,
      required: true,
      enum: POLICY_CATEGORIES,
    },
    jurisdiction: {
      type: String,
      required: true,
      enum: ['central', 'state'],
      default: 'central',
    },
    stateOrRegion: {
      type: String,
      trim: true,
      default: null,
    },
    officialUrl: {
      type: String,
      required: [true, 'officialUrl is required'],
      trim: true,
      validate: {
        validator: (value: string) => /^https?:\/\/.+/.test(value),
        message: 'officialUrl must start with http:// or https://',
      },
    },
    effectiveDate: {
      type: Date,
      default: null,
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

policySchemeSchema.index({ recordKind: 1, category: 1, jurisdiction: 1 });
policySchemeSchema.index({ isDemoData: 1, verificationStatus: 1 });
policySchemeSchema.index({ title: 'text', description: 'text', issuingOrganization: 'text' });

export type PolicySchemeDocument = InferSchemaType<typeof policySchemeSchema>;

export const PolicySchemeModel =
  (mongoose.models.PolicyScheme as mongoose.Model<PolicySchemeDocument>) ||
  mongoose.model<PolicySchemeDocument>('PolicyScheme', policySchemeSchema);

