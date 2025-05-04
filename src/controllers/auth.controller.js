const { login, logout, register } = require('../services/auth.service')
const { checkEmail, addUser, addNote, checkAndGetEmail, createSession } = require('../../database')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const SESSION_NAME = "session_id"

const loginController = async (req, res) => {

    const body = req.body

    if (!body || !body.email || !body.password)
        return res.status(400).json({ message: 'username or password invalid' })
    try {

        let foundEmail = await checkAndGetEmail(body.email)

        if (!foundEmail) {
            return res.status(400).json({ message: "email or password incorrect!" })
        }

        if (Array.isArray(foundEmail)) {
            foundEmail = foundEmail[0]
        }
        const { password } = foundEmail
        const token = crypto.randomUUID()
        if (await bcrypt.compare(body.password, password)) {
            res.cookie(SESSION_NAME, token, {
                httpOnly: false,
                sameSite: 'lax', // or 'strict'
                secure: false,   // must be false on HTTP
                expires: new Date(Date.now() + 900000)
            })

            await createSession(token, foundEmail.id)

            res.status(200).json({ message: "Login Success", data: { userId: foundEmail.id.toString() } })
        } else {
            return res.status(501).json({ message: "Internal server error" })
        }

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


const registerController = async (req, res) => {
    const user = req.body
    if (!user.firstName || !user.lastName || !user.email || !user.password)
        return res.status(400).json({ message: "all fields are required" })

    try {
        const existingUsers = await checkEmail(user.email)
        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        const created = await addUser(user)

        if (!created) {
            throw new Error("Internal server error")
        }
        else {
            return res.status(201).json({
                message: "user registration is completed",
            });
        }

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        })
    }
}

const profileController = async (req, res) => {
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
    res.send()
}


const logoutController = async (req, res) => {
    res.clearCookie(SESSION_NAME, { path: '/' });
    return res.status(200).send("Logout successful!")
}

module.exports = { loginController, registerController, logoutController, profileController }