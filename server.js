const express = require('express');
// console.log(express)

const { db, createUserTable, addUser, checkEmail, checkAndGetEmail, createSessionTable } = require('./database.js')
const app = express()
const cors = require('cors');
app.use(express.json());
// Configure CORS
const corsOptions = {
    origin: 'http://localhost:5501', //  frontend's URL
    // methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Specify allowed HTTP methods
    // allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers,
    credentials: true // allow cookies to be sent
};
app.use(cors(corsOptions))

app.get('/', (req, res) => {
    return res.json({
        message: "user fetched from database successfully",
        data: { name: "Sujal", age: 20 }
    })

});

app.post('/register', (req, res) => {
    console.log(req.body, "request body")
    const user = req.body


    checkEmail(user.email, (result) => {
        if (result) {
            return res.status(400).json({
                error: "user already exist",
            })
        } else {
            addUser(user)
            return res.status(201).json({
                message: "user registration is completed",
            })
        }
    })

});

app.post('/note', (req, res) => {
    const body = req.body
    if (!body || !body.title || !body.content) {
        return res.status(400).json({ error: 'all fields are required' })
    }




})

const SESSION_NAME = "session_id"

app.post('/login', (req, res) => {
    const body = req.body
    checkAndGetEmail(body.email, (result) => {
        if (result) {
            const { password } = result
            if (body.password === password) {
                res.cookie(SESSION_NAME, "hello", {
                    httpOnly: false,
                    sameSite: 'lax', // or 'strict'
                    secure: false,   // must be false on HTTP
                    expires: new Date(Date.now() + 900000)
                })
                res.status(200).json({ message: "Login Success" })
            } else {
                return res.status(401).json({ message: "email or password incorrect" })
            }

        } else {

            return res.status(403).json({
                message: "email or password incorrect"
            });
        }
    })

});

app.listen(3455, () => {
    createUserTable(db)

    createSessionTable(db)
    console.log("server started on port 3455")
})

const user = {
    name: "Jack",
    age: 1
}


// object destructure

// const {name, age} = user 
// const name = user.name
// const age = user.age


// array destructuring
const citites = ['New Delhi', 'Kathmandu']
const [city] = citites
