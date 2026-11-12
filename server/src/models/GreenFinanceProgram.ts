import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import {
  FINANCE_BORROWER_PROFILES,
  FINANCE_CATEGORIES,
  FINANCE_PROJECT_TYPES,
  VERIFICATION_STATUSES,
} from '../types/domain.js';

const greenFinanceProgramSchema = new Schema(
  {
    programName: {
      type: String,
      required: [true, 'programName is required'],
      trim: true,
      maxlength: 250,
    },
    institutionName: {
      type: String,
      required: [true, 'institutionName is required'],
      trim: true,
      maxlength: 200,
    },
    financeCategory: {
      type: String,
      required: true,
      enum: FINANCE_CATEGORIES,
      default: 'concessional_loan',
    },
    supportedProjectTypes: {
      type: [String],
      required: true,
      enum: FINANCE_PROJECT_TYPES,
      default: ['all_renewables'],
    },
    borrowerProfiles: {
      type: [String],
      required: true,
      enum: FINANCE_BORROWER_PROFILES,
      default: ['all'],
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
    termsNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default:
        'Consult the official institution circular for current terms; GreenGrid India does not quote interest rates, loan terms, or approval guarantees.',
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
    collection: 'green_finance_programs',
  }
);

greenFinanceProgramSchema.index({ isDemoData: 1, financeCategory: 1, lastVerifiedAt: -1 });
greenFinanceProgramSchema.index({ institutionName: 1 });
greenFinanceProgramSchema.index({ verificationStatus: 1 });

export type GreenFinanceProgramDocument = InferSchemaType<typeof greenFinanceProgramSchema>;

export const GreenFinanceProgramModel =
  (mongoose.models.GreenFinanceProgram as mongoose.Model<GreenFinanceProgramDocument>) ||
  mongoose.model<GreenFinanceProgramDocument>('GreenFinanceProgram', greenFinanceProgramSchema);

