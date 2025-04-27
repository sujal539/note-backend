const sqlite = require('sqlite3').verbose();
const bcrypt = require('bcrypt')



const anonymFn = err => {
    console.log(`this is error ${err}`)
}
const db = new sqlite.Database('note.db', anonymFn);


function createNoteTableWithForeignKey(tableName){
    db.serialize(() => {
    db.run(`CREATE TABLE ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            uid INTEGER NOT NULL,
            FOREIGN KEY (uid) REFERENCES users(id)
        );`);
    });
    
}

const createUserTable = (db) => {
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS users  (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL,email TEXT UNIQUE NOT NULL, password TEXT NOT NULL )", (err) => { console.log(err) })
    });

}
const createSessionTable = (db) => {
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS session  (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL,  FOREIGN KEY (user_id) REFERENCES users(id)  )", (err) => { console.log(err) })
    });

}
const getAllNotes = (db,callback,onFailure) => {
    //get userid
    const uid = 5
    const query = `select * from notes where uid = ?`
    db.all(query, [uid], (err, result) => {
        if (err) {
            onFailure(err,"werr")
        }
        console.log(result,'db-result')
        callback(result)


    });
}


const addUser = async(user) => {
    
    const hashedPass = await bcrypt.hash(user.password,16)
    const stmt = db.prepare("INSERT INTO users(first_name,last_name,email,password) VALUES(?,?,?,?)");
    stmt.run(user.firstName, user.lastName, user.email, hashedPass);
    stmt.finalize();
}

const addNote = (notes) => {
    const stmt = db.prepare("INSERT INTO notes(title,content,uid) VALUES(?,?,?)");
    stmt.run(notes.title, notes.content, notes.uid);
    stmt.finalize();
}


function checkEmail(email, callback) {
    const query = `select 1 from users where email = ? limit 1`
    db.get(query, [email], (err, result) => {
        if (err) {

        }
        callback(result)


    });

}

function checkAndGetEmail(email, callback,error) {
    const query = `select * from users where email = ?`
    db.get(query, [email], (err, result) => {
        if (err) {
            error(err)
        }

        callback(result)


    });

}

module.exports = { db, addNote, createUserTable, addUser, checkEmail, checkAndGetEmail, createNoteTableWithForeignKey,createSessionTable,getAllNotes }


