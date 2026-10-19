const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, registerSchema, loginSchema } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/verify-profile', authenticateToken, authController.verifyProfile);
router.post('/update-photo', authenticateToken, authController.updateProfilePhoto);

module.exports = router;
