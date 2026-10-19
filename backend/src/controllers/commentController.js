const Comment = require('../models/commentModel');

exports.addComment = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        const comment = await Comment.create({
            campaignId,
            userId,
            content: content.trim()
        });

        res.status(201).json({
            message: 'Comment added successfully',
            comment
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Internal server error adding comment' });
    }
};

exports.getCampaignComments = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const comments = await Comment.findByCampaign(campaignId);
        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Internal server error fetching comments' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        await Comment.delete(id, userId, userRole);
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: error.message || 'Internal server error deleting comment' });
    }
};
