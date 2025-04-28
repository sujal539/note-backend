const sqlite = require('sqlite3').verbose();
const bcrypt = require('bcrypt')


/**
 * 
 * @param {*} db 
 * @description This function creates a user table
 * @returns {void}
 */
const createUserTable = (db) => {
    db.run("CREATE TABLE IF NOT EXISTS users  (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL,email TEXT UNIQUE NOT NULL, password TEXT NOT NULL )", (err) => { console.log(err) })
}

/**
 * @param {*} tableName 
 * @description This function creates a note table with foreign key
 * @returns {void}
 */
function createNoteTable(tableName) {
    db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            uid INTEGER NOT NULL,
            FOREIGN KEY (uid) REFERENCES users(id)
        );`);
    console.log(`Table ${tableName} created successfully.`);
}

/**
 * 
 * @param {*} db 
 * @description This function creates a session table
 * @returns {void}
 */
const createSessionTable = (db) => {
    db.run("CREATE TABLE IF NOT EXISTS session  (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL,  FOREIGN KEY (user_id) REFERENCES users(id)  )", (err) => { console.log(err) })
}


/**
 * @description this function creates a database connection
 * @param {string} dbPath - The path to the database file.
 * @returns {sqlite.Database} - The database connection object.
 * @throws {Error} - If there is an error opening the database.
 * @example
 * const db = createDatabaseConnection('path/to/database.db');  
 */
const createDatabaseConnection = (dbPath) => {
    const db = new sqlite.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database ' + err.message);
        } else {
            console.log('Connected to the SQLite database.');
        }
    });
    return db;
};

// create a database connection
const db = createDatabaseConnection('./note.db');

/**
 * 
 * @description This function creates a note table with foreign key
 * @param {string} tableName - The name of the table to be created.
 * @returns {void}
 * @throws {Error} - If there is an error creating the table.
 * @example
 * createNoteTableWithForeignKey('notes');
 */

function initializeDatabase(db) {
    db.serialize(() => {
        db.run("PRAGMA foreign_keys = ON"); // need to enable foreign key support
        createUserTable(db);
        createSessionTable(db);
        createNoteTable(db, 'notes');
    });
}

initializeDatabase(db);




/**
 * @description This function gets all notes from the database
 * @param {sqlite.Database} db - The database connection object.
 * @param {function} callback - The callback function to handle the result.
 * @param {function} onFailure - The callback function to handle errors.
 * @returns {void}
 */
const getAllNotes = (db, callback, onFailure) => {
    //get userid
    const uid = 5
    const query = `select * from notes where uid = ?`
    db.all(query, [uid], (err, result) => {
        if (err) {
            onFailure(err, "werr")
        }
        console.log(result, 'db-result')
        callback(result)
    });
}


const addUser = async (user) => {
    const hashedPass = await bcrypt.hash(user.password, 16)
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

function checkAndGetEmail(email, callback, error) {
    const query = `select * from users where email = ?`
    db.get(query, [email], (err, result) => {
        if (err) {
            error(err)
        }

        callback(result)


    });

}

module.exports = { db, addNote, createUserTable, addUser, checkEmail, checkAndGetEmail, createNoteTableWithForeignKey: createNoteTable, createSessionTable, getAllNotes }


