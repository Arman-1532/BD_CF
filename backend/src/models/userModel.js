const prisma = require('../config/db');

class User {
    static async findByEmail(email) {
        try {
            return await prisma.user.findUnique({
                where: { email: email.toLowerCase() }
            });
        } catch (err) {
            console.error('User.findByEmail error:', err);
            throw err;
        }
    }

    static async findById(userId) {
        try {
            return await prisma.user.findUnique({
                where: { userId }
            });
        } catch (err) {
            console.error('User.findById error:', err);
            return null;
        }
    }

    static async updateProfile(userId, { displayName, bio, phone }) {
        return await prisma.user.update({
            where: { userId },
            data: {
                displayName: displayName !== undefined ? displayName : undefined,
                bio: bio !== undefined ? bio : undefined,
                phone: phone !== undefined ? phone : undefined
            }
        });
    }

    static async updatePayout(userId, payoutDetails) {
        return await prisma.user.update({
            where: { userId },
            data: { payoutDetails: JSON.stringify(payoutDetails) }
        });
    }

    static async updateNotifications(userId, notificationPrefs) {
        return await prisma.user.update({
            where: { userId },
            data: { notificationPrefs: JSON.stringify(notificationPrefs) }
        });
    }

    static async submitVerification(userId, verificationDoc) {
        return await prisma.user.update({
            where: { userId },
            data: { verificationDoc }
        });
    }

    static async saveOtp(userId, otpCode, expiresAt) {
        return await prisma.user.update({
            where: { userId },
            data: {
                otpCode,
                otpExpiresAt: expiresAt
            }
        });
    }

    static async verifyUser(userId) {
        return await prisma.user.update({
            where: { userId },
            data: {
                isVerified: true,
                otpCode: null,
                otpExpiresAt: null
            }
        });
    }

    static async create({ displayName, email, passwordHash, role = 'STANDARD', otpCode, otpExpiresAt }) {
        return await prisma.user.create({
            data: {
                displayName,
                email: email.toLowerCase(),
                passwordHash,
                role,
                otpCode,
                otpExpiresAt,
                isVerified: false
            },
            select: {
                userId: true,
                displayName: true,
                email: true,
                role: true,
                status: true,
                isVerified: true,
                createdAt: true
            }
        });
    }

    static async updateProfilePhoto(userId, profilePhotoUrl) {
        return await prisma.user.update({
            where: { userId },
            data: { profilePhotoUrl }
        });
    }

    static async saveRefreshToken(userId, tokenHash, expiresAt) {
        try {
            await prisma.authToken.create({
                data: {
                    userId,
                    tokenHash,
                    type: 'refresh',
                    expiresAt
                }
            });
        } catch (err) {
            console.error('User.saveRefreshToken error:', err);
            throw err;
        }
    }

    static async removeRefreshToken(tokenHash) {
        await prisma.authToken.deleteMany({
            where: {
                tokenHash,
                type: 'refresh'
            }
        });
    }
}

module.exports = User;
