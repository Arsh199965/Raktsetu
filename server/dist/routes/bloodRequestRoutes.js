"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware"); // Assuming authorizeRole middleware
const BloodRequest_1 = __importDefault(require("../models/BloodRequest"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// Create a new blood request (Client only)
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)('client'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bloodType, hospitalName, locationDetails, timeLimit, // Expecting ISO Date string
    urgency, additionalInfo, } = req.body;
    const clientId = req.user.id;
    if (!bloodType || !hospitalName || !locationDetails || !timeLimit || !urgency) {
        return res.status(400).json({ message: 'Missing required fields for blood request.' });
    }
    try {
        const newRequest = new BloodRequest_1.default({
            clientId,
            bloodType,
            hospitalName,
            locationDetails,
            timeLimit: new Date(timeLimit),
            urgency,
            additionalInfo,
            status: 'active', // Or 'pending' if you have an approval step
        });
        yield newRequest.save();
        res.status(201).json(newRequest);
    }
    catch (error) {
        console.error('Error creating blood request:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while creating blood request.' });
    }
}));
// Get blood requests (for clients - their own, for donors - active ones)
router.get('/', authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        let requests;
        if (userRole === 'client') {
            requests = yield BloodRequest_1.default.find({ clientId: userId }).sort({ createdAt: -1 });
        }
        else if (userRole === 'donor') {
            // For donors, fetch active requests, potentially filter by location/blood group later
            // For now, fetching all active requests. Add blood group matching.
            const donor = yield User_1.default.findById(userId).select('bloodGroup');
            if (!donor || !donor.bloodGroup) {
                return res.status(400).json({ message: 'Donor blood group not found. Please update your profile.' });
            }
            requests = yield BloodRequest_1.default.find({
                status: 'active',
                // bloodType: donor.bloodGroup // Basic matching
                // Add more complex matching logic here, e.g., compatible blood types
            }).sort({ urgency: -1, createdAt: -1 }); // Sort by urgency then by newest
        }
        else {
            return res.status(403).json({ message: 'Unauthorized role.' });
        }
        res.json(requests);
    }
    catch (error) {
        console.error('Error fetching blood requests:', error);
        res.status(500).json({ message: 'Server error while fetching blood requests.' });
    }
}));
// Get a specific blood request by ID
router.get('/:requestId', authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const request = yield BloodRequest_1.default.findById(req.params.requestId).populate('clientId', 'name phoneNumber');
        if (!request) {
            return res.status(404).json({ message: 'Blood request not found.' });
        }
        // Add authorization: ensure client owns it or donor is eligible (e.g. assigned or accepted)
        res.json(request);
    }
    catch (error) {
        console.error('Error fetching specific blood request:', error);
        res.status(500).json({ message: 'Server error.' });
    }
}));
// Donor accepts a blood request
router.post('/:requestId/accept', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)('donor'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const donorId = req.user.id;
    const { requestId } = req.params;
    try {
        const request = yield BloodRequest_1.default.findById(requestId);
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
        yield request.save();
        // TODO: Send notification to client
        res.json({ message: 'Request accepted successfully.', request });
    }
    catch (error) {
        console.error('Error accepting blood request:', error);
        res.status(500).json({ message: 'Server error while accepting request.' });
    }
}));
// TODO: Add routes for:
// - Donor marking arrival (PUT /:requestId/arrive)
// - Client confirming donor callback (POST /:requestId/confirm-callback)
// - Cancelling a request (PUT /:requestId/cancel - by Client or Admin)
// - Fulfilling a request (PUT /:requestId/fulfill - by Client or Admin)
exports.default = router;
