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
    const query = `select * from session where token = ?`
    db.get(query, [session_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "internal server error"
            })
        }
       // if (result===undefined || result===null) {
        if (!result) {
            return res.status(401).json({
                message: "unauthorized"
            })
        }
        // console.log(result, "result")
        req.user = result
        console.log(req.method, req.url, req.body)
        next()
    })
   
});

module.exports = isAuthenticated