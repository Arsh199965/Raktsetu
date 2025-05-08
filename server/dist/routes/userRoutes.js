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
const authMiddleware_1 = require("../middleware/authMiddleware"); // Assuming you'll create this
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// Route to get donor details
router.get('/donor-details', authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('GET /api/user/donor-details hit by user:', (req as any).user.id);
    try {
        const user = yield User_1.default.findById(req.user.id).select('age weight bloodGroup healthInfo');
        if (!user) {
            // console.log('Donor details not found for user:', (req as any).user.id);
            return res.status(404).json({ message: 'Donor details not found.' });
        }
        // console.log('Returning donor details for user:', (req as any).user.id, user);
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching donor details:', error);
        res.status(500).json({ message: 'Server error while fetching donor details.' });
    }
}));
// Route to update donor details
router.put('/donor-details', authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('PUT /api/user/donor-details hit by user:', (req as any).user.id);
    // console.log('Request body:', req.body);
    const { age, weight, bloodGroup, healthInfo } = req.body;
    if (age === undefined || weight === undefined || bloodGroup === undefined || healthInfo === undefined) {
        // console.log('Validation failed: Missing fields for user:', (req as any).user.id);
        return res.status(400).json({ message: 'Missing required fields: age, weight, bloodGroup, healthInfo.' });
    }
    if (typeof age !== 'number' || age <= 0) {
        return res.status(400).json({ message: 'Invalid age.' });
    }
    if (typeof weight !== 'number' || weight <= 0) {
        return res.status(400).json({ message: 'Invalid weight.' });
    }
    if (!bloodGroup || typeof bloodGroup !== 'string') { // Add more specific blood group validation if needed
        return res.status(400).json({ message: 'Invalid blood group.' });
    }
    if (!Array.isArray(healthInfo) || healthInfo.length === 0) {
        return res.status(400).json({ message: 'Health info must be a non-empty array.' });
    }
    // Add more validation for healthInfo items if necessary
    try {
        const user = yield User_1.default.findByIdAndUpdate(req.user.id, { $set: { age, weight, bloodGroup, healthInfo, detailsSubmitted: true } }, // Mark details as submitted
        { new: true, runValidators: true, context: 'query' } // Added context query for unique validator if any on these fields
        ).select('age weight bloodGroup healthInfo detailsSubmitted');
        if (!user) {
            // console.log('User not found for update:', (req as any).user.id);
            return res.status(404).json({ message: 'User not found.' });
        }
        // console.log('Donor details updated successfully for user:', (req as any).user.id, user);
        res.json({ message: 'Donor details updated successfully.', user });
    }
    catch (error) {
        console.error('Error updating donor details:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while updating donor details.' });
    }
}));
exports.default = router;
