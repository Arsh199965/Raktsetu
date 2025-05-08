import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  phoneNumber: string;
  password: string;
  role: 'donor' | 'client';
  // Donor specific fields
  age?: number;
  weight?: number;
  bloodGroup?: string;
  healthInfo?: string[];
  detailsSubmitted?: boolean;
  // Awards and profile
  donations: number;
  tokens: number;
  title: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'client'], required: true },
  // Donor specific fields
  age: { type: Number, min: 18, max: 65 }, // Typical age range for donors
  weight: { type: Number, min: 45 }, // Minimum weight for donation in kg
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  healthInfo: [{ type: String }], // Array of strings for multiple conditions
  detailsSubmitted: { type: Boolean, default: false }, // To track if donor has submitted their details
  // Awards and profile
  donations: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  title: { type: String, default: 'New Hero' }, // Default title
}, { timestamps: true });

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);