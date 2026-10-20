const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const emailService = require('../config/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_change_in_production_12345';

const generateTokens = (user) => {
    const payload = {
        userId: user.userId,
        email: user.email,
        role: user.role
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
    return { accessToken, refreshToken };
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = async (req, res) => {
    try {
        const { displayName, email, password, role } = req.body;

        if (!displayName || !email || !password) {
            return res.status(400).json({ error: 'Display name, email, and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists
        const existingUser = await User.findByEmail(normalizedEmail);
        if (existingUser) {
            if (!existingUser.isVerified) {
                // If user registered but never verified, resend OTP and allow continuing verification
                const otpCode = generateOtp();
                const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
                await User.saveOtp(existingUser.userId, otpCode, otpExpiresAt);
                try {
                    await emailService.sendOtpEmail(normalizedEmail, otpCode, existingUser.displayName);
                } catch (emailErr) {
                    console.error('Failed to send resend OTP email during re-registration:', emailErr);
                }
                return res.status(200).json({
                    message: 'An account with this email already exists but is unverified. A new OTP has been sent to your email.',
                    requiresVerification: true,
                    email: normalizedEmail
                });
            }
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate OTP
        const otpCode = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user (unverified)
        const newUser = await User.create({
            displayName,
            email: normalizedEmail,
            passwordHash,
            role: role && ['STANDARD', 'ADMIN'].includes(role) ? role : 'STANDARD',
            otpCode,
            otpExpiresAt
        });

        // Send OTP email
        try {
            await emailService.sendOtpEmail(normalizedEmail, otpCode, displayName);
        } catch (emailErr) {
            console.error('Failed to send OTP email:', emailErr);
            // We still create the user, but inform them or log it
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email for the 6-digit verification code.',
            requiresVerification: true,
            email: normalizedEmail
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error during registration', details: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findByEmail(normalizedEmail);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email is already verified. Please log in.' });
        }

        if (!user.otpCode || user.otpCode !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }

        // Mark user as verified
        await User.verifyUser(user.userId);

        const freshUser = await User.findById(user.userId);
        const { accessToken, refreshToken } = generateTokens(freshUser);

        // Save refresh token hash
        const hashedRefreshToken = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await User.saveRefreshToken(freshUser.userId, hashedRefreshToken, expiresAt);

        res.json({
            message: 'Email verified successfully! You are now logged in.',
            accessToken,
            refreshToken,
            user: {
                userId: freshUser.userId,
                displayName: freshUser.displayName,
                email: freshUser.email,
                role: freshUser.role,
                status: freshUser.status,
                isVerified: freshUser.isVerified,
                profilePhotoUrl: freshUser.profilePhotoUrl,
                isBlacklisted: freshUser.isBlacklisted
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Internal server error during OTP verification', details: error.message });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findByEmail(normalizedEmail);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        const otpCode = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await User.saveOtp(user.userId, otpCode, otpExpiresAt);
        await emailService.sendOtpEmail(normalizedEmail, otpCode, user.displayName);

        res.json({
            message: 'A new verification code has been sent to your email.',
            email: normalizedEmail
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Internal server error resending OTP', details: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findByEmail(normalizedEmail);

        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.isBlacklisted) {
            return res.status(403).json({ 
                error: `Your account has been suspended. Reason: ${user.blacklistReason || 'Violation of platform terms.'}` 
            });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Account is suspended. Please contact support.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            // Generate and send a fresh OTP if not verified
            const otpCode = generateOtp();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await User.saveOtp(user.userId, otpCode, otpExpiresAt);
            try {
                await emailService.sendOtpEmail(user.email, otpCode, user.displayName);
            } catch (emailErr) {
                console.error('Failed to send verification OTP on login:', emailErr);
            }

            return res.status(403).json({
                error: 'Please verify your email address before logging in. A new verification code has been sent.',
                requiresVerification: true,
                email: user.email
            });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token hash
        const hashedRefreshToken = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await User.saveRefreshToken(user.userId, hashedRefreshToken, expiresAt);

        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                userId: user.userId,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                status: user.status,
                isVerified: user.isVerified,
                profilePhotoUrl: user.profilePhotoUrl,
                isBlacklisted: user.isBlacklisted
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login', details: error.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Refresh token is invalid or expired' });
            }

            const user = await User.findById(decoded.userId);
            if (!user || user.isBlacklisted || user.status === 'suspended') {
                return res.status(403).json({ error: 'User not found, suspended, or blacklisted' });
            }

            const hashedToken = hashToken(refreshToken);
            // Issue new tokens
            const tokens = generateTokens(user);
            
            // Rotate refresh token: remove old, save new
            await User.removeRefreshToken(hashedToken);
            const newHashedRefresh = hashToken(tokens.refreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await User.saveRefreshToken(user.userId, newHashedRefresh, expiresAt);

            res.json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error during token refresh' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            const hashedToken = hashToken(refreshToken);
            await User.removeRefreshToken(hashedToken);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error during logout' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.isBlacklisted) {
            return res.status(404).json({ error: 'User not found or blacklisted' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.verifyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { verificationDoc } = req.body;

        if (!verificationDoc) {
            return res.status(400).json({ error: 'Verification document data (NID or ID) is required' });
        }

        await User.updateVerificationDoc(userId, verificationDoc);
        res.json({ message: 'Verification document submitted successfully.' });
    } catch (error) {
        console.error('Verify profile error:', error);
        res.status(500).json({ error: 'Internal server error submitting verification' });
    }
};



exports.updatePayout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { payoutMethod, accountNo, bankName, branch, accountName, routingNo } = req.body;

        if (!payoutMethod || !accountNo) {
            return res.status(400).json({ error: 'Payout method and account number are required' });
        }

        const payoutDetails = { payoutMethod, accountNo, bankName, branch, accountName, routingNo };
        await User.updatePayout(userId, payoutDetails);
        res.json({ message: 'Payout details saved successfully', payoutDetails });
    } catch (error) {
        console.error('Update payout error:', error);
        res.status(500).json({ error: 'Internal server error saving payout details' });
    }
};

exports.updateNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { emailNotif, smsNotif } = req.body;

        const notificationPrefs = { emailNotif: !!emailNotif, smsNotif: !!smsNotif };
        await User.updateNotifications(userId, notificationPrefs);
        res.json({ message: 'Notification preferences updated successfully', notificationPrefs });
    } catch (error) {
        console.error('Update notifications error:', error);
        res.status(500).json({ error: 'Internal server error updating notification preferences' });
    }
};

exports.updateProfilePhoto = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { profilePhotoUrl } = req.body;

        if (!profilePhotoUrl) {
            return res.status(400).json({ error: 'Profile photo URL or image data is required' });
        }

        await User.updateProfilePhoto(userId, profilePhotoUrl);
        res.json({ message: 'Profile photo updated successfully', profilePhotoUrl });
    } catch (error) {
        console.error('Update profile photo error:', error);
        res.status(500).json({ error: 'Internal server error updating profile photo' });
    }
};
