const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    if (res.headersSent) {
        return next(err);
    }

    const status = err.status || 500;
    const problem = {
        type: `https://httpstatuses.com/${status}`,
        title: err.title || 'Internal Server Error',
        status: status,
        detail: err.message || 'An unexpected error occurred.',
        instance: req.originalUrl,
        timestamp: new Date().toISOString()
    };

    return res.status(status).json(problem);
};

module.exports = errorHandler;
