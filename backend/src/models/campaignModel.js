const prisma = require('../config/db');
const logger = require('../config/logger');

class Campaign {
    static async create({ title, description, category, targetAmount, endDate, imageData, imageType, verificationDoc, verificationDocType, videoLink, location, unionOrWard, postCode, createdById }) {
        return await prisma.campaign.create({
            data: {
                title,
                description,
                category,
                targetAmount: parseFloat(targetAmount),
                endDate,
                imageData,
                imageType,
                verificationDoc: verificationDoc || null,
                verificationDocType: verificationDocType || null,
                videoLink: videoLink || null,
                location: location || 'Dhaka, Bangladesh',
                unionOrWard: unionOrWard || null,
                postCode: postCode || null,
                createdById
            },
            include: {
                createdBy: {
                    select: {
                        userId: true,
                        displayName: true,
                        email: true,
                        isVerified: true,
                        profilePhotoUrl: true
                    }
                }
            }
        });
    }

    static async findById(id) {
        return await prisma.campaign.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        userId: true,
                        displayName: true,
                        email: true,
                        isVerified: true,
                        profilePhotoUrl: true
                    }
                },
                donations: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        donorName: true,
                        isAnonymous: true,
                        amount: true,
                        createdAt: true
                    }
                }
            }
        });
    }

    static async findApproved({ search, category } = {}) {
        const where = { status: 'APPROVED' };

        if (category && category !== 'All') {
            where.category = category;
        }

        if (search && search.trim() !== '') {
            const searchTerm = search.trim();
            where.OR = [
                { title: { contains: searchTerm } },
                { description: { contains: searchTerm } },
                { createdBy: { displayName: { contains: searchTerm } } }
            ];
        }

        try {
            return await prisma.campaign.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            userId: true,
                            displayName: true,
                            email: true,
                            isVerified: true,
                            profilePhotoUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (err) {
            logger.error(`Database query error in findApproved: ${err.message}`);
            // Fallback: return empty array instead of 500 if DB table/column has minor mismatch
            return [];
        }
    }


    static async findAllByUserAdminOrOwner(userId, requesterId, requesterRole) {
        const where = requesterRole === 'ADMIN' ? { createdById: userId } : { createdById: userId, status: 'APPROVED' };
        if (requesterId === userId) {
            delete where.status;
        }
        try {
            return await prisma.campaign.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            userId: true,
                            displayName: true,
                            email: true,
                            isVerified: true,
                            profilePhotoUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (err) {
            logger.error(`Database query error in findAllByUserAdminOrOwner: ${err.message}`);
            return [];
        }
    }

    static async findAllPending() {
        return await prisma.campaign.findMany({
            where: { status: 'PENDING' },
            include: {
                createdBy: {
                    select: {
                        userId: true,
                        displayName: true,
                        email: true,
                        isVerified: true,
                        profilePhotoUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    static async countStats() {
        const [totalUsers, pendingCampaigns, liveCampaigns] = await Promise.all([
            prisma.user.count(),
            prisma.campaign.count({ where: { status: 'PENDING' } }),
            prisma.campaign.count({ where: { status: 'APPROVED' } })
        ]);
        return { totalUsers, pendingCampaigns, liveCampaigns };
    }

    static async createDonation({ campaignId, userId, donorName, isAnonymous, amount, paymentRef }) {
        return await prisma.$transaction(async (tx) => {
            const donation = await tx.donation.create({
                data: {
                    campaignId,
                    userId: userId || null,
                    donorName: isAnonymous ? 'Anonymous' : (donorName || 'Generous Donor'),
                    isAnonymous: !!isAnonymous,
                    amount: parseFloat(amount),
                    paymentRef: paymentRef || 'MOCK_PAYMENT_' + Date.now(),
                    status: 'COMPLETED'
                }
            });

            // Increment campaign currentAmount
            await tx.campaign.update({
                where: { id: campaignId },
                data: {
                    currentAmount: {
                        increment: parseFloat(amount)
                    }
                }
            });

            return donation;
        });
    }

    static async updateStatus(id, status) {
        return await prisma.campaign.update({
            where: { id },
            data: { status }
        });
    }
}

module.exports = Campaign;
