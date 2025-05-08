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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// Signup Route
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST /api/auth/signup hit');
    console.log('Request body:', req.body);
    try {
        const { name, phoneNumber, password, role, age, weight, bloodGroup, healthInfo } = req.body;
        let user = yield User_1.default.findOne({ phoneNumber });
        if (user) {
            console.log('Signup attempt for existing user:', phoneNumber);
            return res.status(400).json({ message: 'User already exists' });
        }
        user = new User_1.default(Object.assign({ name,
            phoneNumber,
            password,
            role }, (role === 'donor' && {
            age,
            weight,
            bloodGroup,
            healthInfo,
        })));
        yield user.save();
        console.log('User created successfully:', user.phoneNumber, 'Role:', user.role);
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };
        jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', // Use an environment variable for the secret
        { expiresIn: '1h' }, // Token expires in 1 hour
        (err, token) => {
            if (err) {
                console.error('JWT sign error during signup:', err);
                throw err;
            }
            console.log('Token generated for user:', user.phoneNumber);
            res.json({ token, role: user.role }); // Also return role on signup
        });
    }
    catch (err) {
        console.error('Error in /signup route:', err.message);
        res.status(500).send('Server error');
    }
}));
// Login Route
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('POST /api/auth/login hit');
    console.log('Request body:', req.body);
    try {
        const { phoneNumber, password } = req.body;
        const user = yield User_1.default.findOne({ phoneNumber });
        if (!user) {
            console.log('Login attempt for non-existent user:', phoneNumber);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            console.log('Login attempt with incorrect password for user:', phoneNumber);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('User logged in successfully:', user.phoneNumber, 'Role:', user.role);
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };
        jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', // Use an environment variable for the secret
        { expiresIn: '2D' }, (err, token) => {
            if (err) {
                console.error('JWT sign error during login:', err);
                throw err;
            }
            console.log('Token generated for user:', user.phoneNumber);
            res.json({ token, role: user.role }); // Return role on login as well
        });
    }
    catch (err) {
        console.error('Error in /login route:', err.message);
        res.status(500).send('Server error');
    }
}));
exports.default = router;
