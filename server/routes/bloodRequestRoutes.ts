import express, { Request, Response } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware'; // Assuming authorizeRole middleware
import BloodRequest, { IBloodRequest } from '../models/BloodRequest';
import User from '../models/User';

const router = express.Router();

// Create a new blood request (Client only)
router.post('/', authenticateToken, authorizeRole('client'), async (req: Request, res: Response) => {
  const {
    bloodType,
    hospitalName,
    locationDetails,
    timeLimit, // Expecting ISO Date string
    urgency,
    additionalInfo,
  } = req.body;
  const clientId = (req as any).user.id;

  if (!bloodType || !hospitalName || !locationDetails || !timeLimit || !urgency) {
    return res.status(400).json({ message: 'Missing required fields for blood request.' });
  }

  try {
    const newRequest = new BloodRequest({
      clientId,
      bloodType,
      hospitalName,
      locationDetails,
      timeLimit: new Date(timeLimit),
      urgency,
      additionalInfo,
      status: 'active', // Or 'pending' if you have an approval step
    });
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error: any) {
    console.error('Error creating blood request:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while creating blood request.' });
  }
});

// Get blood requests (for clients - their own, for donors - active ones)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  try {
    let requests;
    if (userRole === 'client') {
      requests = await BloodRequest.find({ clientId: userId }).sort({ createdAt: -1 });
    } else if (userRole === 'donor') {
      // For donors, fetch active requests, potentially filter by location/blood group later
      // For now, fetching all active requests. Add blood group matching.
      const donor = await User.findById(userId).select('bloodGroup');
      if (!donor || !donor.bloodGroup) {
        return res.status(400).json({ message: 'Donor blood group not found. Please update your profile.'});
      }
      requests = await BloodRequest.find({
         status: 'active', 
         // bloodType: donor.bloodGroup // Basic matching
         // Add more complex matching logic here, e.g., compatible blood types
        }).sort({ urgency: -1, createdAt: -1 }); // Sort by urgency then by newest
    } else {
      return res.status(403).json({ message: 'Unauthorized role.' });
    }
    res.json(requests);
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({ message: 'Server error while fetching blood requests.' });
  }
});

// Get a specific blood request by ID
router.get('/:requestId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const request = await BloodRequest.findById(req.params.requestId).populate('clientId', 'name phoneNumber');
        if (!request) {
            return res.status(404).json({ message: 'Blood request not found.' });
        }
        // Add authorization: ensure client owns it or donor is eligible (e.g. assigned or accepted)
        res.json(request);
    } catch (error) {
        console.error('Error fetching specific blood request:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Donor accepts a blood request
router.post('/:requestId/accept', authenticateToken, authorizeRole('donor'), async (req: Request, res: Response) => {
  const donorId = (req as any).user.id;
  const { requestId } = req.params;

  try {
    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found.' });
    }
    if (request.status !== 'active') {
      return res.status(400).json({ message: 'This request is no longer active.' });
    }

    // Check if donor has already accepted or is assigned (optional, based on your logic)
    if (request.confirmedDonors.includes(donorId)) {
        return res.status(400).json({ message: 'You have already accepted this request.' });
    }

    // TODO: Add logic to check if max donors (e.g., 3) already confirmed.
    // For now, let's assume we can add more.

    request.confirmedDonors.push(donorId);
    // Optionally, move from assignedDonors if that list is used for initial notification
    // request.assignedDonors = request.assignedDonors.filter(id => id.toString() !== donorId.toString());

    // Potentially update status if enough donors have accepted
    // if (request.confirmedDonors.length >= TARGET_DONOR_COUNT) {
    //   request.status = 'partially_fulfilled'; // or 'fulfilled' depending on logic
    // }

    await request.save();

    // TODO: Send notification to client

    res.json({ message: 'Request accepted successfully.', request });
  } catch (error) {
    console.error('Error accepting blood request:', error);
    res.status(500).json({ message: 'Server error while accepting request.' });
  }
});


// TODO: Add routes for:
// - Donor marking arrival (PUT /:requestId/arrive)
// - Client confirming donor callback (POST /:requestId/confirm-callback)
// - Cancelling a request (PUT /:requestId/cancel - by Client or Admin)
// - Fulfilling a request (PUT /:requestId/fulfill - by Client or Admin)

export default router;
