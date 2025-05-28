const express = require('express');
require('dotenv').config()
const authRoutes = require('./routes/auth.js')
const noteRoutes = require('./routes/notes.js')
const app = express()
const cors = require('cors');
const isAuthenticated = require('./middlewares/parseCookie')
const { initializeDatabase } = require('../database')
const cookieParser = require('cookie-parser');
app.use(express.json());

// Configure CORS
const allowedOrigins = ['http://localhost:5501', 'http://127.0.0.1:5501', 'http://192.168.57.146:5173', 'http://192.168.57.23:5173', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5173',
    'https://note.api.app-dev.site'
]
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        }
        else {
            callback(new Error('cors policy violation'), false)
        }
    },
    credentials: true // allow cookies to be sent
}));

app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.use('/auth', authRoutes)
app.use(isAuthenticated)
app.use('/api', noteRoutes)


app.listen(3455, () => {
    initializeDatabase();
    console.log(process.env.NODE_ENV)
    console.log("server started on port 3455")
})





