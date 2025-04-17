const sqlite = require('sqlite3').verbose();



const anonymFn = err => {
    console.log(`this is error ${err}`)
    console.log('this is error ', err)
    console.log('this is error ' + err)
}
const db = new sqlite.Database('note.db', anonymFn);

// // db.serialize(() => {
//     db.run("CREATE TABLE notes (title TEXT)");

//     const stmt = db.prepare("INSERT INTO notes VALUES (?)");

//     for (let i = 0; i < 10; i++) {
//         stmt.run("my note " + i);
//     }
//     stmt.finalize();

//     db.each("SELECT rowid AS id, title FROM notes", (err, row) => {
//         if(err) 
//             console.log(err)
//         else 
//             console.log(row.id + ": " + row.title);
//     });
// // })

const createUserTable = (db) => {
    db.serialize(() => {
            db.run("CREATE TABLE IF NOT EXISTS users  (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL,email TEXT UNIQUE NOT NULL, password TEXT NOT NULL )",(err) => {console.log(err)})
        });

}
const addUser = (user) => {
  const stmt = db.prepare("INSERT INTO users(first_name,last_name,email,password) VALUES(?,?,?,?)");
  stmt.run(user.firstName,user.lastName,user.email,user.password);
  stmt.finalize();
}
function checkEmail(email, callback){
    const query = `select 1 from users where email = ? limit 1`
    db.get(query,[email],(err,result)=>{
        if (err) {

        }
       callback(result)
       
       
    });

}

module.exports = { db, createUserTable,addUser,checkEmail}


