import type { Request, Response } from 'express';
import db from '../persistence/index.js';
import { generateToken, hashPassword, comparePassword, generateResetToken } from '../auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Sign Up
export const signUp = async (req: Request, res: Response) => {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password and username are required' });
        }

        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await db.createUser(email, hashedPassword, username);

        // Generate token
        const token = generateToken({ userId: user.id, email: user.email, username: user.username });

        // Set secure HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Sign up error:', errorMessage);
        console.error('Stack:', errorStack);
        
        // Send detailed error in development
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({ 
            error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error'
        });
    }
};

// Sign In
export const signIn = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare passwords
        const isPasswordValid = await comparePassword(password, user.hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken({ userId: user.id, email: user.email, username: user.username });

        // Set secure HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            message: 'Logged in successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Sign in error:', errorMessage);
        console.error('Stack:', errorStack);
        
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({ 
            error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error'
        });
    }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user
        const user = await db.getUserByEmail(email);
        if (!user) {
            // Don't reveal if email exists (security best practice)
            return res.status(200).json({
                message: 'If an account exists with that email, you will receive a password reset link',
            });
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const expiresAt = Date.now() + RESET_TOKEN_EXPIRY;

        await db.createPasswordResetToken(user.id, resetToken, expiresAt);

        // TODO: Send email with reset link
        // For now, log the reset link to console (for development)
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost'}/reset-password?token=${resetToken}`;
        console.log(`Password reset link for ${email}: ${resetLink}`);

        res.status(200).json({
            message: 'If an account exists with that email, you will receive a password reset link',
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Forgot password error:', errorMessage);
        console.error('Stack:', errorStack);
        
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({ 
            error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error'
        });
    }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        // Find reset token
        const resetToken = await db.getPasswordResetToken(token);
        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Check if token is expired
        if (Date.now() > resetToken.expiresAt) {
            await db.deletePasswordResetToken(resetToken.id);
            return res.status(400).json({ error: 'Reset token has expired' });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user password
        await db.updatePassword(resetToken.userId, hashedPassword);

        // Delete reset token
        await db.deletePasswordResetToken(resetToken.id);

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Reset password error:', errorMessage);
        console.error('Stack:', errorStack);
        
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({ 
            error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error'
        });
    }
};

// Logout
export const logout = async (req: AuthRequest, res: Response) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Logout error:', errorMessage);
        console.error('Stack:', errorStack);
        
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({ 
            error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error'
        });
    }
};

// Get Current User
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await db.getUserById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Get current user error:', errorMessage);
        console.error('Stack:', errorStack);
        
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({ 
            error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error'
        });
    }
};
