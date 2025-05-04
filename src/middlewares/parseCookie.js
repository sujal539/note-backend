/**
 * * Middleware to check authentication session
 * * @param {Request} req   - The request object.
 * * @param {Response} res  - The response object.
 * * @param {Function} next - The next middleware function.
 * * @returns {void}
 * * @throws {Error} If the session is invalid or expired.
 * * @description This middleware checks if the user is authenticated by verifying the session token.
 * * If the session is valid, it calls the next middleware function. Otherwise, it returns a 401 Unauthorized response.
 * 
 */

const { validate } = require("../../database");

const isAuthenticated = (async (req, res, next) => {
    if (!req.cookies) {
        return res.status(401).json({
            message: "unauthorized"
        })
    }
    const session_id = req.cookies.session_id
    if (!session_id) {
        return res.status(401).json({
            message: "unauthorized"
        })
    }
    try {
        const foundSession = await validate(session_id)
        req.user = foundSession[0]
        next()

    } catch (error) {
        return res.status(500).json({message: "Internal server error"})
    }
   
});

module.exports = isAuthenticated