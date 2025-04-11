const express = require('express');
// console.log(express)

const {db,createUserTable,addUser} = require('./database.js')
const app  = express()
const cors = require('cors');
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    return res.json({
        message: "user fetched from database successfully",
        data: {name: "Sujal", age: 20}
    })

});

app.post('/register', (req, res) => {
    const user =  req.body
    addUser(user)
    console.log(req.body, "request body")
    return res.json(user)
});

app.post('/login', (req, res) => {
    console.log(req.body, "request body")
    return res.json({
       
    })
});

app.listen(3455, ()=> {
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
