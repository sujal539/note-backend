const { login, logout, register } = require('../services/auth.service');
const {
    checkEmail,
    addUser,
    addNote,
    checkAndGetEmail,
    createSession,
    getUserByToken
} = require('../../database');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SESSION_NAME = "session_id";
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

/**
 * Handles user login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check user existence and get user data
        let foundEmail = await checkAndGetEmail(email);

        if (!foundEmail || (Array.isArray(foundEmail) && foundEmail.length === 0)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (Array.isArray(foundEmail)) {
            foundEmail = foundEmail[0];
        }

        // Password verification
        const isPasswordValid = await bcrypt.compare(password, foundEmail.password);

        if (!isPasswordValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate session token
        const token = crypto.randomUUID();

        // Set secure cookie
        res.cookie(SESSION_NAME, token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(Date.now() + 3600000), // 1 hour
            path: '/'
        });

        // Create session
        await createSession(token, foundEmail.id);

        // Send success response
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Login successful',
            data: {
                userId: foundEmail.id.toString()
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
};

/**
 * Handles user registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const registerController = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Input validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'All fields are required: firstName, lastName, email, password'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Password strength validation
        if (password.length < 8) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check for existing user
        const existingUsers = await checkEmail(email);
        if (existingUsers.length > 0) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        const created = await addUser({ firstName, lastName, email, password });

        if (!created) {
            throw new Error('Failed to create user');
        }

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'User registration completed successfully'
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred during registration'
        });
    }
};

/**
 * Handles user profile retrieval
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const profileController = async (req, res) => {
    try {
        if (!req.cookies || !req.cookies[SESSION_NAME]) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const user = await getUserByToken(req.cookies[SESSION_NAME]);

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }

        // Remove sensitive information
        delete user.password;

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Profile retrieval error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred while retrieving profile'
        });
    }
};

/**
 * Handles user logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const logoutController = async (req, res) => {
    try {
        res.clearCookie(SESSION_NAME, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred during logout'
        });
    }
};

module.exports = {
    loginController,
    registerController,
    profileController,
    logoutController
};