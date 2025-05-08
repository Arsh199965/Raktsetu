import express, { Request, Response } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import BloodRequest from '../models/BloodRequest';
import User from '../models/User';

const router = express.Router();

// Record a completed donation and award tokens
router.post('/complete/:requestId', authenticateToken, authorizeRole('donor'), async (req: Request, res: Response) => {
  const donorId = (req as any).user.id;
  const { requestId } = req.params;
  const { arrivalTime } = req.body; // Time taken to arrive in minutes (optional)

  try {
    // Find the blood request
    const request = await BloodRequest.findById(requestId).populate('clientId');
    
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found.' });
    }

    // Check if donor is already in the confirmed donors list
    if (!request.confirmedDonors.includes(donorId)) {
      return res.status(400).json({ message: 'You are not assigned to this request.' });
    }

    // Calculate tokens based on urgency, time of day, and arrival time
    let tokenAward = 10; // Base tokens

    // Add tokens based on urgency
    switch (request.urgency) {
      case 'critical':
        tokenAward += 20;
        break;
      case 'high':
        tokenAward += 15;
        break;
      case 'medium':
        tokenAward += 10;
        break;
      case 'low':
        tokenAward += 5;
        break;
    }

    // Calculate time of day bonus (e.g., late night donations)
    const donationHour = new Date().getHours();
    if (donationHour < 6 || donationHour > 22) {
      // Night time (10pm - 6am)
      tokenAward += 10;
    }

    // Calculate quick response bonus
    if (arrivalTime && arrivalTime <= 30) {
      // If arrived within 30 minutes
      tokenAward += 15;
    } else if (arrivalTime && arrivalTime <= 60) {
      // If arrived within 1 hour
      tokenAward += 10;
    }

    // Update donor's donation count and tokens
    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found.' });
    }

    donor.donations += 1;
    donor.tokens += tokenAward;

    // Update donor's title based on donations count
    if (donor.donations >= 20) {
      donor.title = 'Legendary Life Saver';
    } else if (donor.donations >= 10) {
      donor.title = 'Experienced Hero';
    } else if (donor.donations >= 5) {
      donor.title = 'Rising Hero';
    } else {
      donor.title = 'New Hero';
    }

    await donor.save();

    // Update request status if needed (this is a simplified logic)
    if (request.confirmedDonors.length >= 3) {
      request.status = 'fulfilled';
    } else {
      request.status = 'partially_fulfilled';
    }
    await request.save();

    res.json({ 
      message: 'Donation recorded successfully!', 
      tokensAwarded: tokenAward, 
      totalTokens: donor.tokens, 
      title: donor.title 
    });
    
  } catch (error) {
    console.error('Error recording donation:', error);
    res.status(500).json({ message: 'Server error while recording donation.' });
  }
});

// Get donor rewards and achievements
router.get('/rewards', authenticateToken, authorizeRole('donor'), async (req: Request, res: Response) => {
  try {
    const donor = await User.findById((req as any).user.id).select('donations tokens title');
    
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found.' });
    }

    // Calculate progress to next title
    let nextTitle;
    let progress = 0;
    
    if (donor.donations < 5) {
      nextTitle = 'Rising Hero';
      progress = (donor.donations / 5) * 100;
    } else if (donor.donations < 10) {
      nextTitle = 'Experienced Hero';
      progress = ((donor.donations - 5) / 5) * 100;
    } else if (donor.donations < 20) {
      nextTitle = 'Legendary Life Saver';
      progress = ((donor.donations - 10) / 10) * 100;
    } else {
      nextTitle = null; // Already at highest title
      progress = 100;
    }

    // Calculate unlocked achievements
    const achievements = [
      {
        id: 'first_donation',
        name: 'First Drop',
        description: 'Complete your first donation',
        unlocked: donor.donations >= 1,
      },
      {
        id: 'five_donations',
        name: 'Regular Hero',
        description: 'Complete 5 donations',
        unlocked: donor.donations >= 5,
      },
      {
        id: 'ten_donations',
        name: 'Dedicated Hero',
        description: 'Complete 10 donations',
        unlocked: donor.donations >= 10,
      },
      {
        id: 'twenty_donations',
        name: 'Legendary Status',
        description: 'Complete 20 donations',
        unlocked: donor.donations >= 20,
      },
    ];

    // Calculate unlocked rewards (t-shirts, certificates)
    const rewards = [
      {
        id: 'certificate_1',
        name: 'Rookie Donor Certificate',
        type: 'certificate',
        description: 'For completing your first donation',
        unlocked: donor.donations >= 1,
      },
      {
        id: 'tshirt_1',
        name: 'Hero T-Shirt',
        type: 'tshirt',
        description: 'Unlock after 5 donations',
        unlocked: donor.donations >= 5,
        comingSoon: true,
      },
      {
        id: 'certificate_2',
        name: 'Experienced Donor Certificate',
        type: 'certificate',
        description: 'For completing 10 donations',
        unlocked: donor.donations >= 10,
      },
      {
        id: 'tshirt_2',
        name: 'Legendary Hero T-Shirt',
        type: 'tshirt',
        description: 'Unlock after 20 donations',
        unlocked: donor.donations >= 20,
        comingSoon: true,
      },
    ];

    res.json({
      donations: donor.donations,
      tokens: donor.tokens,
      title: donor.title,
      nextTitle,
      progress,
      achievements,
      rewards,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ message: 'Server error while fetching rewards.' });
  }
});

export default router;
