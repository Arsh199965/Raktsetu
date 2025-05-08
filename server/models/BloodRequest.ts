import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodRequest extends Document {
  clientId: mongoose.Schema.Types.ObjectId;
  bloodType: string;
  hospitalName: string;
  locationDetails: string; // Could be more structured (e.g., address, city, pincode) or even GeoJSON
  timeLimit: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  additionalInfo?: string;
  status: 'pending' | 'active' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
  assignedDonors: mongoose.Schema.Types.ObjectId[]; // Donors who have been notified/assigned
  confirmedDonors: mongoose.Schema.Types.ObjectId[]; // Donors who have confirmed they will donate
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema: Schema = new Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodType: { 
    type: String, 
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
  },
  hospitalName: { type: String, required: true },
  locationDetails: { type: String, required: true }, // For simplicity, a string for now
  timeLimit: { type: Date, required: true },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  additionalInfo: { type: String },
  status: {
    type: String,
    enum: ['pending', 'active', 'partially_fulfilled', 'fulfilled', 'cancelled'],
    default: 'pending',
  },
  assignedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  confirmedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model<IBloodRequest>('BloodRequest', BloodRequestSchema);
