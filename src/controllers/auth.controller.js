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
const logger = require('../utils/logger');

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
        logger.info('Login attempt', {
            email: req.body.email,
            ip: req.ip
        });

        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            logger.warn('Login attempt with missing credentials', {
                email: !!email,
                password: !!password,
                ip: req.ip
            });
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logger.warn('Login attempt with invalid email format', {
                email,
                ip: req.ip
            });
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check user existence and get user data
        let foundEmail = await checkAndGetEmail(email);

        if (!foundEmail || (Array.isArray(foundEmail) && foundEmail.length === 0)) {
            logger.warn('Login attempt with non-existent email', {
                email,
                ip: req.ip
            });
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
            logger.warn('Login attempt with invalid password', {
                email,
                userId: foundEmail.id,
                ip: req.ip
            });
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

        logger.info('Login successful', {
            userId: foundEmail.id,
            email,
            ip: req.ip
        });

        // Send success response
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Login successful',
            data: {
                userId: foundEmail.id.toString()
            }
        });

    } catch (error) {
        logger.error('Login error', {
            error: error.message,
            stack: error.stack,
            email: req.body?.email,
            ip: req.ip
        });
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
        logger.info('Registration attempt', {
            email: req.body.email,
            ip: req.ip
        });

        const { firstName, lastName, email, password } = req.body;

        // Input validation
        if (!firstName || !lastName || !email || !password) {
            logger.warn('Registration attempt with missing fields', {
                firstName: !!firstName,
                lastName: !!lastName,
                email: !!email,
                password: !!password,
                ip: req.ip
            });
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'All fields are required: firstName, lastName, email, password'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logger.warn('Registration attempt with invalid email format', {
                email,
                ip: req.ip
            });
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Password strength validation
        if (password.length < 8) {
            logger.warn('Registration attempt with weak password', {
                email,
                passwordLength: password.length,
                ip: req.ip
            });
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check for existing user
        const existingUsers = await checkEmail(email);
        if (existingUsers.length > 0) {
            logger.warn('Registration attempt with existing email', {
                email,
                ip: req.ip
            });
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

        logger.info('Registration successful', {
            email,
            ip: req.ip
        });

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'User registration completed successfully'
        });

    } catch (error) {
        logger.error('Registration error', {
            error: error.message,
            stack: error.stack,
            email: req.body?.email,
            ip: req.ip
        });
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
            logger.warn('Profile access attempt without session cookie', {
                ip: req.ip,
                cookies: !!req.cookies
            });
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const sessionToken = req.cookies[SESSION_NAME];
        const user = await getUserByToken(sessionToken);

        if (!user) {
            logger.warn('Profile access attempt with invalid session', {
                ip: req.ip,
                sessionToken
            });
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }

        // Remove sensitive information
        delete user.password;

        logger.info('Profile retrieved successfully', {
            userId: user.id,
            ip: req.ip
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: user
        });

    } catch (error) {
        logger.error('Profile retrieval error', {
            error: error.message,
            stack: error.stack,
            sessionToken: req.cookies?.[SESSION_NAME],
            ip: req.ip
        });
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
        const sessionToken = req.cookies?.[SESSION_NAME];

        logger.info('Logout attempt', {
            sessionToken: !!sessionToken,
            ip: req.ip
        });

        res.clearCookie(SESSION_NAME, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        logger.info('Logout successful', {
            sessionToken: !!sessionToken,
            ip: req.ip
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        logger.error('Logout error', {
            error: error.message,
            stack: error.stack,
            sessionToken: req.cookies?.[SESSION_NAME],
            ip: req.ip
        });
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