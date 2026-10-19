const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, optionalAuthenticateToken, requireRole } = require('../middleware/auth');

router.patch('/campaigns/:id/takedown', authenticateToken, requireRole('ADMIN'), adminController.takedownCampaign);
router.post('/users/:id/blacklist', authenticateToken, requireRole('ADMIN'), adminController.blacklistUser);
router.post('/users/:id/unblacklist', authenticateToken, requireRole('ADMIN'), adminController.unblacklistUser);
router.get('/users', authenticateToken, requireRole('ADMIN'), adminController.getAdminUsers);
router.get('/audit-logs', authenticateToken, requireRole('ADMIN'), adminController.getAuditLogs);
router.get('/campaigns', authenticateToken, requireRole('ADMIN'), adminController.getAllCampaignsAdmin);
router.get('/categories', adminController.getCategories);
router.post('/reports', optionalAuthenticateToken, adminController.reportCampaign);
router.get('/reports', authenticateToken, requireRole('ADMIN'), adminController.getReports);
router.patch('/reports/:id/status', authenticateToken, requireRole('ADMIN'), adminController.updateReportStatus);
router.post('/categories', authenticateToken, requireRole('ADMIN'), adminController.createCategory);
router.delete('/categories/:id', authenticateToken, requireRole('ADMIN'), adminController.deleteCategory);

module.exports = router;
