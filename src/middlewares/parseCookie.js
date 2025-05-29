const { validate } = require("../../database");

// HTTP Status codes
const HTTP_STATUS = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INTERNAL_SERVER_ERROR: 500
};

// Constants
const COOKIE_NAME = 'session_id';
const MAX_TOKEN_LENGTH = 1000; // Reasonable maximum length for a session token

/**
 * Middleware to verify authentication session
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
const isAuthenticated = async (req, res, next) => {
    try {
        // Check if cookies exist
        if (!req.cookies) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get session token
        const sessionId = req.cookies[COOKIE_NAME];

        // Validate session token existence
        if (!sessionId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Basic token validation
        if (typeof sessionId !== 'string' ||
            sessionId.length === 0 ||
            sessionId.length > MAX_TOKEN_LENGTH) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }

        // Validate session in database and get user information
        const sessionInfo = await validate(sessionId);

        if (!sessionInfo) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Session expired or invalid'
            });
        }

        // Set user information in request object
        req.user = {
            sessionId,
            userId: sessionInfo.user_id,
            firstName: sessionInfo.first_name,
            lastName: sessionInfo.last_name,
            email: sessionInfo.email,
            session_id: sessionInfo.session_id
        };

        // Continue to next middleware
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Authentication service unavailable'
        });
    }
};

module.exports = isAuthenticated;