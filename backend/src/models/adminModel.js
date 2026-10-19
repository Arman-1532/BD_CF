const prisma = require('../config/db');

class Admin {
    static async logAction({ adminId, action, targetId, reason }) {
        return await prisma.adminAuditLog.create({
            data: {
                adminId,
                action,
                targetId,
                reason
            }
        });
    }

    static async takedownCampaign(campaignId, reason, adminId) {
        const result = await prisma.$transaction(async (tx) => {
            const campaign = await tx.campaign.update({
                where: { id: campaignId },
                data: {
                    status: 'TAKEN_DOWN',
                    takedownReason: reason,
                    takenDownAt: new Date()
                }
            });

            await tx.adminAuditLog.create({
                data: {
                    adminId,
                    action: 'CAMPAIGN_TAKEN_DOWN',
                    targetId: campaignId,
                    reason
                }
            });

            return campaign;
        });
        return result;
    }

    static async blacklistUser(userId, reason, takedownCampaigns, adminId) {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Blacklist user
            const user = await tx.user.update({
                where: { userId },
                data: {
                    isBlacklisted: true,
                    blacklistedAt: new Date(),
                    blacklistReason: reason
                }
            });

            // 2. Revoke all refresh tokens / auth tokens
            await tx.authToken.deleteMany({
                where: { userId }
            });

            // 3. Takedown campaigns if requested
            if (takedownCampaigns) {
                await tx.campaign.updateMany({
                    where: { createdById: userId, status: { not: 'TAKEN_DOWN' } },
                    data: {
                        status: 'TAKEN_DOWN',
                        takedownReason: `Owner blacklisted: ${reason}`,
                        takenDownAt: new Date()
                    }
                });
            }

            // 4. Audit log
            await tx.adminAuditLog.create({
                data: {
                    adminId,
                    action: 'USER_BLACKLISTED',
                    targetId: userId,
                    reason
                }
            });

            return user;
        });
        return result;
    }

    static async unblacklistUser(userId, adminId) {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { userId },
                data: {
                    isBlacklisted: false,
                    blacklistedAt: null,
                    blacklistReason: null
                }
            });

            await tx.adminAuditLog.create({
                data: {
                    adminId,
                    action: 'USER_UNBLACKLISTED',
                    targetId: userId,
                    reason: 'Account reinstated by admin'
                }
            });

            return user;
        });
        return result;
    }

    static async getAllUsers() {
        return await prisma.user.findMany({
            select: {
                userId: true,
                displayName: true,
                email: true,
                role: true,
                status: true,
                isVerified: true,
                profilePhotoUrl: true,
                createdAt: true,
                _count: {
                    select: { campaigns: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getAuditLogs() {
        return await prisma.adminAuditLog.findMany({
            include: {
                admin: {
                    select: { displayName: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    static async getAllCampaignsForAdmin() {
        return await prisma.campaign.findMany({
            include: {
                createdBy: {
                    select: { displayName: true, email: true, isVerified: true, profilePhotoUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getCategories() {
        return await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
    }

    static async reportCampaign({ campaignId, userId, reason }) {
        return await prisma.campaignReport.create({
            data: {
                campaignId,
                userId: userId || null,
                reason,
                status: 'PENDING'
            }
        });
    }

    static async getReports() {
        return await prisma.campaignReport.findMany({
            include: {
                campaign: {
                    select: { id: true, title: true, status: true, createdBy: { select: { displayName: true, email: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async updateReportStatus(reportId, status, adminId) {
        return await prisma.$transaction(async (tx) => {
            const report = await tx.campaignReport.update({
                where: { id: reportId },
                data: { status }
            });

            await tx.adminAuditLog.create({
                data: {
                    adminId,
                    action: `REPORT_${status}`,
                    targetId: reportId,
                    reason: `Marked report as ${status}`
                }
            });

            return report;
        });
    }

    static async createCategory(name, adminId) {
        return await prisma.$transaction(async (tx) => {
            const category = await tx.category.create({
                data: { name }
            });
            await tx.adminAuditLog.create({
                data: {
                    adminId,
                    action: 'CATEGORY_CREATED',
                    targetId: category.id,
                    reason: `Created category: ${name}`
                }
            });
            return category;
        });
    }

    static async deleteCategory(id, adminId) {
        return await prisma.$transaction(async (tx) => {
            const cat = await tx.category.findUnique({ where: { id } });
            if (!cat) throw new Error('Category not found');

            await tx.category.delete({
                where: { id }
            });

            await tx.adminAuditLog.create({
                data: {
                    adminId,
                    action: 'CATEGORY_DELETED',
                    targetId: id,
                    reason: `Deleted category: ${cat.name}`
                }
            });
            return cat;
        });
    }
}

module.exports = Admin;
