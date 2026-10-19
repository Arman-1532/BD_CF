const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
const { validate, commentSchema } = require('../middleware/validator');

router.get('/:campaignId', commentController.getCampaignComments);
router.post('/:campaignId', authenticateToken, validate(commentSchema), commentController.addComment);
router.delete('/:id', authenticateToken, commentController.deleteComment);

module.exports = router;
