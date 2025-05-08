import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware'; // Assuming you'll create this
import User from '../models/User';

const router = express.Router();

// Route to get donor details
router.get('/donor-details', authenticateToken, async (req: Request, res: Response) => {
  // console.log('GET /api/user/donor-details hit by user:', (req as any).user.id);
  try {
    const user = await User.findById((req as any).user.id).select('age weight bloodGroup healthInfo');
    if (!user) {
      // console.log('Donor details not found for user:', (req as any).user.id);
      return res.status(404).json({ message: 'Donor details not found.' });
    }
    // console.log('Returning donor details for user:', (req as any).user.id, user);
    res.json(user);
  } catch (error) {
    console.error('Error fetching donor details:', error);
    res.status(500).json({ message: 'Server error while fetching donor details.' });
  }
});

// Route to update donor details
router.put('/donor-details', authenticateToken, async (req: Request, res: Response) => {
  // console.log('PUT /api/user/donor-details hit by user:', (req as any).user.id);
  // console.log('Request body:', req.body);
  const { age, weight, bloodGroup, healthInfo } = req.body;

  if (age === undefined || weight === undefined || bloodGroup === undefined || healthInfo === undefined) {
    // console.log('Validation failed: Missing fields for user:', (req as any).user.id);
    return res.status(400).json({ message: 'Missing required fields: age, weight, bloodGroup, healthInfo.' });
  }
  if (typeof age !== 'number' || age <=0) {
    return res.status(400).json({ message: 'Invalid age.'});
  }
  if (typeof weight !== 'number' || weight <=0) {
    return res.status(400).json({ message: 'Invalid weight.'});
  }
  if (!bloodGroup || typeof bloodGroup !== 'string') { // Add more specific blood group validation if needed
    return res.status(400).json({ message: 'Invalid blood group.'});
  }
  if (!Array.isArray(healthInfo) || healthInfo.length === 0) {
    return res.status(400).json({ message: 'Health info must be a non-empty array.'});
  }
  // Add more validation for healthInfo items if necessary

  try {
    const user = await User.findByIdAndUpdate(
      (req as any).user.id,
      { $set: { age, weight, bloodGroup, healthInfo, detailsSubmitted: true } }, // Mark details as submitted
      { new: true, runValidators: true, context: 'query' } // Added context query for unique validator if any on these fields
    ).select('age weight bloodGroup healthInfo detailsSubmitted');

    if (!user) {
      // console.log('User not found for update:', (req as any).user.id);
      return res.status(404).json({ message: 'User not found.' });
    }
    // console.log('Donor details updated successfully for user:', (req as any).user.id, user);
    res.json({ message: 'Donor details updated successfully.', user });
  } catch (error: any) {
    console.error('Error updating donor details:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while updating donor details.' });
  }
});

export default router;
