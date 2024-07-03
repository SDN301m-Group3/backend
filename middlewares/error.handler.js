require('dotenv').config();

const errorHandler = (err, req, res, next) => {
    const errorStatus = err.statusCode || 500;
    const errorMessage = err.message;
    res.status(errorStatus).json({
        error: {
            status: errorStatus,
            message: errorMessage,
            ...(process.env.NODE_ENV === 'DEV' ? { stack: err.stack } : {}),
        },
    });
};

module.exports = errorHandler;
