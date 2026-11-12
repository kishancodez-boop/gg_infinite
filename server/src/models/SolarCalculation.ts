import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const solarCalculationSchema = new Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 160,
      default: 'Solar ROI Simulation',
    },
    inputs: {
      type: Schema.Types.Mixed,
      required: true,
    },
    assumptions: {
      type: Schema.Types.Mixed,
      required: true,
    },
    resultsSummary: {
      type: Schema.Types.Mixed,
      required: true,
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

solarCalculationSchema.index({ createdAt: -1 });

export type SolarCalculationDocument = InferSchemaType<typeof solarCalculationSchema>;

export const SolarCalculationModel =
  (mongoose.models.SolarCalculation as mongoose.Model<SolarCalculationDocument>) ||
  mongoose.model<SolarCalculationDocument>('SolarCalculation', solarCalculationSchema);

