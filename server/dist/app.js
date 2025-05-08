"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Import user routes
const bloodRequestRoutes_1 = __importDefault(require("./routes/bloodRequestRoutes")); // Import blood request routes
// Load environment variables from .env file
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json()); // For parsing application/json
// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined.');
    process.exit(1); // Exit the process if MONGO_URI is not found
}
mongoose_1.default.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Exit the process on connection error
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/user', userRoutes_1.default); // Use user routes
app.use('/api/blood-requests', bloodRequestRoutes_1.default); // Use blood request routes
app.get('/', (req, res) => {
    res.send('Raktsetu Server is running!');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
