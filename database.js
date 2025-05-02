const mysql = require('mysql')
const bcrypt = require('bcrypt')


/**
 * 
 * @param {*} db 
 * @description This function creates a user table
 * @returns {void}
 */
const createUserTable = (db) => {
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
 * @param {*} tableName 
 * @description This function creates a note table with foreign key
 * @returns {void}
 */
function createNoteTable(tableName) {
    db.query(`CREATE TABLE IF NOT EXISTS ${tableName} (
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

const createMysqlDbConnection = () => {
     const connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'sujal',
        password : 'password',
        database : 'notes'
      });
      connection.query()
      connection.connect();
      return connection
}

   
// create a database connection
// const db = createDatabaseConnection('./note.db');
const db = createMysqlDbConnection()

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
    createUserTable(db);
    createSessionTable(db);
    createNoteTable('notes');
}

initializeDatabase(db);





/**
 * @description This function gets all notes from the database
 * @param {sqlite.Database} db - The database connection object.
 * @param {function} success - The callback function to handle the result.
 * @param {function} onFailure - The callback function to handle errors.
 * @returns {void}
 */
const getAllNotes = (db, userId, success, onFailure) => {
    const query = `SELECT * FROM notes WHERE uid = ?`;
    db.query(query, [userId], (err, results) => {
        if (err) {
            return onFailure(err, "Query error");
        }
        console.log(results, 'db-result');
        success(results);
    });
};

const addUser = async (user) => {
    const hashedPass = await bcrypt.hash(user.password, 16);
    const query = "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
    db.query(query, [user.firstName, user.lastName, user.email, hashedPass], (err, results) => {
        if (err) {
            console.error("Error adding user:", err);
        } else {
            console.log("User added successfully.");
        }
    });
};

const addNote = (note) => {
    const query = "INSERT INTO notes (title, content, uid) VALUES (?, ?, ?)";
    db.query(query, [note.title, note.content, note.uid], (err, results) => {
        if (err) {
            console.error("Error adding note:", err);
        } else {
            console.log("Note added successfully.");
        }
    });
};

function checkEmail(email, callback) {
    const query = `SELECT 1 FROM users WHERE email = ? LIMIT 1`;
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error("Error checking email:", err);
            return callback(null);
        }
        callback(results.length > 0 ? results[0] : null);
    });
}

function checkAndGetEmail(email, callback, error) {
    const query = `SELECT * FROM users WHERE email = ?`;
    db.query(query, [email], (err, results) => {
        if (err) return error(err);
        if (!results.length) return error(new Error("No user found"));
        callback(results[0]);
    });
}

module.exports = {
    db,
    addNote,
    createUserTable,
    addUser,
    checkEmail,
    checkAndGetEmail,
    createNoteTableWithForeignKey: createNoteTable,
    createSessionTable,
    getAllNotes
};