const express = require('express');
// console.log(express)

const { db, createUserTable, addUser, checkEmail,checkAndGetEmail } = require('./database.js')
const app = express()
const cors = require('cors');
app.use(express.json());
// Configure CORS
const corsOptions = {
    origin: 'http://127.0.0.1:5501', //  frontend's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
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

app.post('/login', (req, res) => {
    const body = req.body
    checkAndGetEmail(body.email, (result) =>{
       if(result){
        const {password} = result
        if(body.password === password){
            return res.status(200).json({message: "Login Success"})
        }else{
            return res.status(401).json({message: "email or password incorrect"})
        }
        
    }else{

        return res.status(403).json({
            message: "email or password incorrect"
        });
    }
    })
    
});

app.listen(3455, () => {
    createUserTable(db)


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
