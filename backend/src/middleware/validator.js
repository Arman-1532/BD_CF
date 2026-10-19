const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        if (schema) {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
        }
        next();
    } catch (err) {
        return res.status(400).json({
            type: 'https://httpstatuses.com/400',
            title: 'Validation Error',
            status: 400,
            detail: err.errors ? err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') : err.message,
            instance: req.originalUrl
        });
    }
};

const registerSchema = z.object({
    body: z.object({
        displayName: z.string().min(1, 'Display name is required'),
        email: z.string().email('Valid email is required'),
        password: z.string().min(1, 'Password is required'),
        role: z.enum(['STANDARD', 'ADMIN']).optional()
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required'),
        password: z.string().min(1, 'Password is required')
    })
});

const campaignSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(1, 'Description is required'),
        category: z.string().min(1, 'Category is required'),
        targetAmount: z.number().positive('Target amount must be positive'),
        endDate: z.string().optional(),
        imageData: z.string().optional(),
        imageType: z.string().optional()
    })
});

const commentSchema = z.object({
    body: z.object({
        content: z.string().min(1, 'Content is required')
    })
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    campaignSchema,
    commentSchema
};
