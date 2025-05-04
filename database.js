const mysql = require('mysql')
const bcrypt = require('bcrypt')


/**
 * 
 * @description This function creates a user table
 * @returns {void}
 */
const createUserTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error creating users table:", err);
        } else {
            console.log("Users table created successfully.");
        }
    });

}

/**
 * @description This function creates a note table with foreign key
 * @returns {void}
 */
function createNoteTable() {
    db.query(`CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            uid INTEGER NOT NULL,
            FOREIGN KEY (uid) REFERENCES users(id)
        );`);

}

/**
 * 
 * @description This function creates a session table
 * @returns {void}
 */
const createSessionTable = () => {
    db.query("CREATE TABLE IF NOT EXISTS session  (id INTEGER PRIMARY KEY AUTO_INCREMENT, token TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL,  FOREIGN KEY (user_id) REFERENCES users(id)  )", (err) => { console.log(err) })
}


const createMysqlDbConnection = () => {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASS,
        database: process.env.DATABASE_NAME,
    });


    connection.connect(err => {
        if (err) console.log("error connecting to database " + err);
    });
    return connection
}


// create a database connection
// const db = createDatabaseConnection('./note.db');
const db = createMysqlDbConnection();

/**
 * 
 * @description This function creates a note table with foreign key
 * @param {string} tableName - The name of the table to be created.
 * @returns {void}
 * @throws {Error} - If there is an error creating the table.
 * @example
 * createNoteTableWithForeignKey('notes');
 */

function initializeDatabase() {
    // db.query('CREATE DATABASE IF NOT EXISTS ' + process.env.DATABASE_NAME)
    createUserTable();
    createSessionTable();
    createNoteTable();
}


/**
 * @description This function gets all notes from the database
 * @param {sqlite.Database} db - The database connection object.
 * @param {function} success - The callback function to handle the result.
 * @param {function} onFailure - The callback function to handle errors.
 * @returns {void}
 */
/**
 * get all notes for a user with user id
 * @param {*} userId 
 * @returns 
 */
const getAllNotes = async (userId) => {
    const query = `SELECT * FROM notes WHERE uid = ?`;
    return await asyncQuery(query, [userId])
};

/**
 * create note for a user
 * @param {*} note 
 * @returns 
 */
const addNote = async (note) => {
    const query = "INSERT INTO notes (title, content, uid) VALUES (?, ?, ?)";
    return  await asyncQuery.query(query, [note.title, note.content, note.uid])
};

/**
 * edit note
 * @param {*} userId 
 * @param {*} noteId 
 * @returns 
 */
const updateNoteInDb = async (userId, noteId, note) => {
    const query = `UPDATE notes SET title = ?, content = ?, WHERE id = ? AND uid = ?;`
    return await asyncQuery(query, [note.title, note.content, noteId, userId])
};

/**
 * delete note
 * @param {*} userId 
 * @param {*} noteId 
 * @returns 
 */
const deleteNoteFromDb = async (userId, noteId) => {
    const query = `DELETE FROM notes WHERE uid = ? AND id = ?`;
    return await asyncQuery(query, [userId, noteId])
};


const asyncQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, result) => {
            if (err)
                reject(err)

            if (result === undefined || result === null) {
                return reject(new Error("Unknown error occurred"));
            }
            resolve(result)
        });
    });
}

const addUser = async (user) => {
    const hashedPass = await bcrypt.hash(user.password, 10);
    const query = "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
    return await asyncQuery(query, [user.firstName, user.lastName, user.email, hashedPass])
};



async function checkEmail(email) {
    const query = `SELECT 1 FROM users WHERE email = ? LIMIT 1`;
    return await asyncQuery(query, [email])
}

async function createSession(token, userId) {
    const query = "INSERT INTO session(token, user_id) VALUES(?, ?)"
    return await asyncQuery(query, [token, userId])
}

async function checkAndGetEmail(email) {
    const query = `SELECT * FROM users WHERE email = ?`;
    return await asyncQuery(query, [email])
}

module.exports = {
    db,
    addNote,
    createUserTable,
    initializeDatabase,
    createSession,
    addUser,
    updateNoteInDb,
    deleteNoteFromDb,
    checkEmail,
    checkAndGetEmail,
    createNoteTableWithForeignKey: createNoteTable,
    createSessionTable,
    getAllNotes
};