const Campaign = require('../models/campaignModel');
const User = require('../models/userModel');

exports.createCampaign = async (req, res) => {
    try {
        const { title, description, category, targetAmount, endDate, imageData, imageType, verificationDoc, verificationDocType, videoLink, location, unionOrWard, postCode } = req.body;
        const createdById = req.user.userId;

        if (!title || !description || !category || !targetAmount || !endDate || !imageData || !imageType) {
            return res.status(400).json({ error: 'All fields including end date and image data are required' });
        }

        const campaign = await Campaign.create({
            title,
            description,
            category,
            targetAmount,
            endDate: new Date(endDate),
            imageData,
            imageType,
            verificationDoc,
            verificationDocType,
            videoLink,
            location,
            unionOrWard,
            postCode,
            createdById
        });

        res.status(201).json({
            message: 'Campaign submitted successfully and is pending approval',
            campaign
        });
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Internal server error during campaign creation' });
    }
};

exports.getPublicCampaigns = async (req, res) => {
    try {
        const { search, category } = req.query;
        const campaigns = await Campaign.findApproved({ search, category });
        res.json({ campaigns });
    } catch (error) {
        console.error('Get public campaigns error:', error);
        res.status(500).json({ error: 'Internal server error fetching campaigns' });
    }
};

exports.getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user ? req.user.userId : null;
        const requesterRole = req.user ? req.user.role : null;

        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // If campaign is not APPROVED, only allow the owner or an ADMIN to view it
        if (campaign.status !== 'APPROVED') {
            const isOwner = requesterId && campaign.createdById === requesterId;
            const isAdmin = requesterRole && requesterRole.toUpperCase() === 'ADMIN';
            if (!isOwner && !isAdmin) {
                return res.status(404).json({ error: 'Campaign not found or no longer active' });
            }
        }

        res.json({ campaign });
    } catch (error) {
        console.error('Get campaign by id error:', error);
        res.status(500).json({ error: 'Internal server error fetching campaign' });
    }
};

exports.getMyCampaigns = async (req, res) => {
    try {
        const userId = req.user.userId;
        const campaigns = await Campaign.findAllByUserAdminOrOwner(userId, userId, req.user.role);
        res.json({ campaigns });
    } catch (error) {
        console.error('Get my campaigns error:', error);
        res.status(500).json({ error: 'Internal server error fetching your campaigns' });
    }
};

exports.getUserProfileCampaigns = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterId = req.user ? req.user.userId : null;
        const requesterRole = req.user ? req.user.role : null;

        let profileUser = null;
        try {
            profileUser = await User.findById(userId);
        } catch (e) {
            console.error('User.findById error in profile:', e);
        }

        if (!profileUser) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        let campaigns = [];
        try {
            campaigns = await Campaign.findAllByUserAdminOrOwner(userId, requesterId, requesterRole);
        } catch (e) {
            console.error('Campaign.findAllByUserAdminOrOwner error:', e);
            campaigns = [];
        }

        let parsedSocialLinks = {};
        try {
            parsedSocialLinks = profileUser.socialLinks ? JSON.parse(profileUser.socialLinks) : {};
        } catch (e) {
            parsedSocialLinks = {};
        }

        res.json({
            profile: {
                userId: profileUser.userId,
                displayName: profileUser.displayName || 'User',
                email: profileUser.email || '',
                phone: profileUser.phone || '',
                role: profileUser.role || 'STANDARD',
                isVerified: !!profileUser.isVerified,
                profilePhotoUrl: profileUser.profilePhotoUrl || null,
                bio: profileUser.bio || '',
                socialLinks: parsedSocialLinks,
                createdAt: profileUser.createdAt || new Date()
            },
            campaigns: campaigns || []
        });
    } catch (error) {
        console.error('Get user profile campaigns error:', error);
        res.status(500).json({ error: 'Internal server error fetching user profile' });
    }
};

exports.getAdminDashboard = async (req, res) => {
    try {
        const stats = await Campaign.countStats();
        const pendingCampaigns = await Campaign.findAllPending();
        res.json({ stats, pendingCampaigns });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Internal server error fetching admin dashboard' });
    }
};

exports.donateToCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, donorName, isAnonymous } = req.body;
        const userId = req.user ? req.user.userId : null;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Valid donation amount is required' });
        }

        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (campaign.status !== 'APPROVED') {
            return res.status(400).json({ error: 'Can only donate to approved and active campaigns' });
        }

        const finalDonorName = isAnonymous ? 'Anonymous' : (donorName || (req.user ? req.user.email : 'Guest Donor'));

        const donation = await Campaign.createDonation({
            campaignId: id,
            userId,
            donorName: finalDonorName,
            isAnonymous: !!isAnonymous,
            amount: parseFloat(amount)
        });

        res.status(201).json({
            message: 'Donation processed successfully via MockPaymentService',
            donation
        });
    } catch (error) {
        console.error('Donation error:', error);
        res.status(500).json({ error: 'Internal server error processing donation' });
    }
};

exports.updateCampaignStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
        }

        const campaign = await Campaign.updateStatus(id, status);
        res.json({
            message: `Campaign status updated to ${status}`,
            campaign
        });
    } catch (error) {
        console.error('Update campaign status error:', error);
        res.status(500).json({ error: 'Internal server error updating campaign status' });
    }
};
