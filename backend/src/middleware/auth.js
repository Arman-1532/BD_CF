const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const env = require('../config/env');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            type: 'https://httpstatuses.com/401',
            title: 'Unauthorized',
            status: 401,
            detail: 'Access token missing or malformed'
        });
    }

    jwt.verify(token, env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({
                type: 'https://httpstatuses.com/403',
                title: 'Forbidden',
                status: 403,
                detail: 'Token is invalid or expired'
            });
        }

        try {
            const user = await prisma.user.findUnique({
                where: { userId: decoded.userId },
                select: { userId: true, email: true, role: true, isBlacklisted: true, status: true }
            });

            if (!user || user.isBlacklisted || user.status === 'suspended') {
                return res.status(403).json({
                    type: 'https://httpstatuses.com/403',
                    title: 'Forbidden',
                    status: 403,
                    detail: 'Account is blacklisted, suspended, or does not exist.'
                });
            }

            req.user = user;
            next();
        } catch (dbErr) {
            return res.status(500).json({
                type: 'https://httpstatuses.com/500',
                title: 'Server Error',
                status: 500,
                detail: 'Internal server error during authentication'
            });
        }
    });
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({
                type: 'https://httpstatuses.com/403',
                title: 'Forbidden',
                status: 403,
                detail: 'Access denied: insufficient permissions'
            });
        }
        next();
    };
};

const optionalAuthenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            req.user = null;
            return next();
        }

        try {
            const user = await prisma.user.findUnique({
                where: { userId: decoded.userId },
                select: { userId: true, email: true, role: true, isBlacklisted: true, status: true }
            });

            if (!user || user.isBlacklisted || user.status === 'suspended') {
                req.user = null;
                return next();
            }

            req.user = user;
            next();
        } catch (dbErr) {
            req.user = null;
            next();
        }
    });
};

module.exports = { authenticateToken, optionalAuthenticateToken, requireRole };
