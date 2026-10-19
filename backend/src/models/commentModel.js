const prisma = require('../config/db');

class Comment {
    static async create({ campaignId, userId, content }) {
        return await prisma.comment.create({
            data: {
                campaignId,
                userId,
                content
            },
            include: {
                user: {
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

    static async findByCampaign(campaignId) {
        return await prisma.comment.findMany({
            where: { campaignId },
            include: {
                user: {
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
    }

    static async delete(commentId, userId, userRole) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.userId !== userId && userRole !== 'ADMIN') {
            throw new Error('Unauthorized to delete this comment');
        }

        return await prisma.comment.delete({
            where: { id: commentId }
        });
    }
}

module.exports = Comment;
