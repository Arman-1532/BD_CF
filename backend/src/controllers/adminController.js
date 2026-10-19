const Admin = require('../models/adminModel');
const Campaign = require('../models/campaignModel');
const prisma = require('../config/db');

exports.takedownCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user.userId;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: 'Takedown reason is required' });
        }

        const campaign = await Admin.takedownCampaign(id, reason.trim(), adminId);
        res.json({
            message: 'Campaign taken down successfully',
            campaign
        });
    } catch (error) {
        console.error('Takedown campaign error:', error);
        res.status(500).json({ error: 'Internal server error taking down campaign' });
    }
};

exports.blacklistUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, takedownCampaigns = true } = req.body;
        const adminId = req.user.userId;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: 'Blacklist reason is required' });
        }

        if (id === adminId) {
            return res.status(400).json({ error: 'You cannot blacklist your own admin account' });
        }

        const user = await Admin.blacklistUser(id, reason.trim(), takedownCampaigns, adminId);
        res.json({
            message: 'User blacklisted and active sessions revoked successfully',
            user
        });
    } catch (error) {
        console.error('Blacklist user error:', error);
        res.status(500).json({ error: 'Internal server error blacklisting user' });
    }
};

exports.unblacklistUser = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        const user = await Admin.unblacklistUser(id, adminId);
        res.json({
            message: 'User account reinstated successfully',
            user
        });
    } catch (error) {
        console.error('Unblacklist user error:', error);
        res.status(500).json({ error: 'Internal server error reinstating user' });
    }
};

exports.getAdminUsers = async (req, res) => {
    try {
        const users = await Admin.getAllUsers();
        res.json({ users });
    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({ error: 'Internal server error fetching users' });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await Admin.getAuditLogs();
        res.json({ logs });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Internal server error fetching audit logs' });
    }
};

exports.getAllCampaignsAdmin = async (req, res) => {
    try {
        const campaigns = await Admin.getAllCampaignsForAdmin();
        res.json({ campaigns });
    } catch (error) {
        console.error('Get all campaigns admin error:', error);
        res.status(500).json({ error: 'Internal server error fetching campaigns' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Admin.getCategories();
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error fetching categories' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const adminId = req.user.userId;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const category = await Admin.createCategory(name.trim(), adminId);
        res.status(201).json({
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Create category error:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Category with this name already exists' });
        }
        res.status(500).json({ error: 'Internal server error creating category' });
    }
};

exports.reportCampaign = async (req, res) => {
    try {
        const { campaignId, reason } = req.body;
        const userId = req.user ? req.user.userId : null;

        if (!campaignId || !reason || !reason.trim()) {
            return res.status(400).json({ error: 'Campaign ID and reason are required' });
        }

        const report = await Admin.reportCampaign({ campaignId, userId, reason: reason.trim() });
        res.status(201).json({
            message: 'Campaign reported successfully. Our moderation team will review it.',
            report
        });
    } catch (error) {
        console.error('Report campaign error:', error);
        res.status(500).json({ error: 'Internal server error reporting campaign' });
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Admin.getReports();
        res.json({ reports });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Internal server error fetching reports' });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = req.user.userId;

        if (!['RESOLVED', 'DISMISSED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be RESOLVED or DISMISSED' });
        }

        const report = await Admin.updateReportStatus(id, status, adminId);
        res.json({
            message: `Report marked as ${status}`,
            report
        });
    } catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ error: 'Internal server error updating report status' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        const category = await Admin.deleteCategory(id, adminId);
        res.json({
            message: 'Category deleted successfully',
            category
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: error.message || 'Internal server error deleting category' });
    }
};
