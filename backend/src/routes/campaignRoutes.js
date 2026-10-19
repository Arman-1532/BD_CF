const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateToken, optionalAuthenticateToken, requireRole } = require('../middleware/auth');
const { validate, campaignSchema } = require('../middleware/validator');

router.get('/my-campaigns', authenticateToken, campaignController.getMyCampaigns);
router.get('/profile/:userId', optionalAuthenticateToken, campaignController.getUserProfileCampaigns);
router.get('/admin/dashboard', authenticateToken, requireRole('ADMIN'), campaignController.getAdminDashboard);
router.patch('/:id/status', authenticateToken, requireRole('ADMIN'), campaignController.updateCampaignStatus);
router.get('/public', campaignController.getPublicCampaigns);
router.get('/:id', optionalAuthenticateToken, campaignController.getCampaignById);
router.post('/:id/donate', optionalAuthenticateToken, campaignController.donateToCampaign);
router.post('/', authenticateToken, validate(campaignSchema), campaignController.createCampaign);

module.exports = router;
