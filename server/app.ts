import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes'; // Import user routes
import bloodRequestRoutes from './routes/bloodRequestRoutes'; // Import blood request routes
import donationRoutes from './routes/donationRoutes'; // Import donation routes

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  process.exit(1); // Exit the process if MONGO_URI is not found
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Exit the process on connection error
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Use user routes
app.use('/api/blood-requests', bloodRequestRoutes); // Use blood request routes
app.use('/api/donations', donationRoutes); // Use donation routes

app.get('/', (req, res) => {
  res.send('Raktsetu Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;