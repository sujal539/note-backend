const express = require('express');
// console.log(express)
const crypto = require('crypto')
const bcrypt = require('bcrypt')

const { db, createUserTable, addUser, checkEmail, checkAndGetEmail, createSessionTable, createNoteTableWithForeignKey,getAllNotes } = require('./database.js')
const app = express()
const cors = require('cors');
const cookieParser = require('cookie-parser');
app.use(express.json());
// Configure CORS
const allowedOrigins = ['http://localhost:5501','http://127.0.0.1:5501','http://127.0.0.1:5500','http://localhost:5500']
app.use(cors({
    origin:(origin,callback) => {
        if(!origin || allowedOrigins.indexOf(origin) !== -1 ){
            callback(null,true)
        }
        else{
            callback(new Error('cors policy violation'),false)
        }
    },
    credentials: true // allow cookies to be sent
}));

app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
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

app.post('/login', (req, res) => {
    const body = req.body

    if(!body || !body.email || !body.password)
        return res.status(400).json({message:'username or password invalid'})

    checkAndGetEmail(body.email, async(result) => {
        if (result) {
            const { password } = result
            const token = crypto.randomUUID()
            if (await bcrypt.compare(body.password,password)) {
                res.cookie(SESSION_NAME, token, {
                    httpOnly: false,
                    sameSite: 'lax', // or 'strict'
                    secure: false,   // must be false on HTTP
                    expires: new Date(Date.now() + 900000)
                })

                const stmt = db.prepare('insert into session(token, user_id) values(?, ?)')

                stmt.run(token, result.id )
                stmt.finalize()


                res.status(200).json({ message: "Login Success",  data : {userId: result.id.toString()}})
            } else {
                return res.status(401).json({ message: "email or password incorrect" })
            }

        } else {

            return res.status(403).json({
                message: "email account not found"
            });
        }
    }, (err) =>{
        return res.status(501).json({
            message: "internal server error"
        });
    } )

});

function x (req, res){
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
app.get("/me", x)

app.use((req, res, next) => {
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
    // console.log(req.cookies, "cookies")
    // console.log(req.headers, "headers")
    // console.log(req.query, "query")
    // console.log(req.params, "params"
   
})

app.post("/logout",(req,res)=>{
    return res.status(200) 
})


app.get('/', (req, res) => {

    return res.json({
        message: "user fetched from database successfully",
        data: { name: "Sujal", age: 20 }
    })

});



app.get('/notes',async(req,res) => {
    const userId = req.user.user_id
    getAllNotes(db,userId, (result) => {
        console.log(result, "result")
        return res.status(200).json(result)
    },(err) => {
        console.log(err)
        return res.status(500).send()
    })
    
})

app.post('/note', (req, res) => {
    const userId = req.user.user_id         
    const body = req.body
    if (!body || !body.title || !body.content) {
        return res.status(400).json({ error: 'all fields are required' })
    }
    const stmt = db.prepare('insert into notes(title,content, uid)values(?,?, ?)');
    stmt.run(body.title,body.content, userId)
    stmt.finalize();
    return res.status(200).json({ message: 'Success' })





})

const SESSION_NAME = "session_id"



app.listen(3455, () => {
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
