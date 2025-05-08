import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const router = express.Router();

// Signup Route
router.post('/signup', async (req: Request, res: Response) => {
  console.log('POST /api/auth/signup hit');
  console.log('Request body:', req.body);
  try {
    const { name, phoneNumber, password, role, age, weight, bloodGroup, healthInfo } = req.body;

    let user = await User.findOne({ phoneNumber });
    if (user) {
      console.log('Signup attempt for existing user:', phoneNumber);
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      phoneNumber,
      password,
      role,
      // Donor specific fields, only add if role is donor
      ...(role === 'donor' && {
        age,
        weight,
        bloodGroup,
        healthInfo,
      }),
    });

    await user.save();
    console.log('User created successfully:', user.phoneNumber, 'Role:', user.role);

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret', // Use an environment variable for the secret
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) {
          console.error('JWT sign error during signup:', err);
          throw err;
        }
        console.log('Token generated for user:', user.phoneNumber);
        res.json({ token, role: user.role }); // Also return role on signup
      }
    );
  } catch (err: any) {
    console.error('Error in /signup route:', err.message);
    res.status(500).send('Server error');
  }
});

// Login Route
router.post('/login', async (req: Request, res: Response) => {
  console.log('POST /api/auth/login hit');
  console.log('Request body:', req.body);
  try {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      console.log('Login attempt for non-existent user:', phoneNumber);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
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

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret', // Use an environment variable for the secret
      { expiresIn: '2D' },
      (err, token) => {
        if (err) {
          console.error('JWT sign error during login:', err);
          throw err;
        }
        console.log('Token generated for user:', user.phoneNumber);
        res.json({ token, role: user.role }); // Return role on login as well
      }
    );
  } catch (err: any) {
    console.error('Error in /login route:', err.message);
    res.status(500).send('Server error');
  }
});

export default router;