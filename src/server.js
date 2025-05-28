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
const allowedOrigins = [
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://192.168.57.146:5173',
    'http://192.168.57.23:5173',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:5173',
    'https://noteapp.web.app-dev.site',
    'https://www.noteapp.web.app.site',
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
    credentials: true, // if you're using cookies/sessions
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // all needed methods
    allowedHeaders: ['Content-Type', 'Authorization'] // required headers
}));


app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.use('/auth', authRoutes)
app.use(isAuthenticated)
app.use('/api', noteRoutes)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});


app.listen(3455, () => {
    initializeDatabase();
    console.log(process.env.NODE_ENV)
    console.log("server started on port 3455")
})





