const sqlite = require('sqlite3').verbose();



const anonymFn = err => {
    console.log(`this is error ${err}`)
    console.log('this is error ', err)
    console.log('this is error ' + err)
}
const db = new sqlite.Database('note.db', anonymFn);


function createNoteTableWithForeignKey(tableName){
    db.serialize(() => {
        db.run(`DROP TABLE IF EXISTS notes;`);

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
createNoteTableWithForeignKey('notes')
// CREATE NOTES TABLE WITH FOREIGN KEY 
// db.serialize(() => {
//     db.run(`DROP TABLE IF EXISTS notes;`);

//     db.run(`CREATE TABLE notes (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         title TEXT NOT NULL,
//         content TEXT,
//         uid INTEGER NOT NULL,
//         FOREIGN KEY (uid) REFERENCES users(id)
//     );`);
// });

//     db.run(sql);

// const stmt = db.prepare("INSERT INTO notes VALUES (?)");

// for (let i = 0; i < 10; i++) {
//     stmt.run("my note " + i);
// }
// stmt.finalize();

// db.each("SELECT rowid AS id, title FROM notes", (err, row) => {
//     if(err) 
//         console.log(err)
//     else 
//         console.log(row.id + ": " + row.title);
// });
// })

const createUserTable = (db) => {
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS users  (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL,email TEXT UNIQUE NOT NULL, password TEXT NOT NULL )", (err) => { console.log(err) })
    });

}
const addUser = (user) => {
    const stmt = db.prepare("INSERT INTO users(first_name,last_name,email,password) VALUES(?,?,?,?)");
    stmt.run(user.firstName, user.lastName, user.email, user.password);
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

function checkAndGetEmail(email, callback) {
    const query = `select * from users where email = ?`
    db.get(query, [email], (err, result) => {
        if (err) {

        }
        callback(result)


    });

}

module.exports = { db, addNote, createUserTable, addUser, checkEmail, checkAndGetEmail, createNoteTableWithForeignKey }


