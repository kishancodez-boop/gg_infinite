import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import {
  AUDIT_ACTIONS,
  AUDIT_RECORD_TYPES,
  VERIFICATION_STATUSES,
} from '../types/domain.js';

const auditProvenanceSchema = new Schema(
  {
    recordType: {
      type: String,
      required: true,
      enum: AUDIT_RECORD_TYPES,
    },
    recordRef: {
      type: Schema.Types.ObjectId,
      required: [true, 'recordRef is required'],
      refPath: 'recordType',
    },
    originalSource: {
      type: String,
      required: [true, 'originalSource is required'],
      trim: true,
      maxlength: 250,
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value: string | null) =>
          value === null || /^https?:\/\/.+/.test(value),
        message: 'sourceUrl must start with http:// or https://',
      },
    },
    retrievedAt: {
      type: Date,
      required: [true, 'retrievedAt is required'],
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: VERIFICATION_STATUSES,
      default: 'unverified',
    },
    transformationNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      default: 'staged',
    },
    actor: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'rea-engine',
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

auditProvenanceSchema.index({ recordType: 1, recordRef: 1 });
auditProvenanceSchema.index({ isDemoData: 1, retrievedAt: -1 });

export type AuditProvenanceDocument = InferSchemaType<typeof auditProvenanceSchema>;

export const AuditProvenanceModel =
  (mongoose.models.AuditProvenance as mongoose.Model<AuditProvenanceDocument>) ||
  mongoose.model<AuditProvenanceDocument>('AuditProvenance', auditProvenanceSchema);

