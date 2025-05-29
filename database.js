const mysql = require('mysql');
const bcrypt = require('bcrypt');

/**
 * @typedef {Object} DatabaseConfig
 * @property {string} host - Database host
 * @property {string} user - Database user
 * @property {string} password - Database password
 * @property {string} database - Database name
 * @property {number} connectionLimit - Maximum number of connections in the pool
 */

/**
 * @typedef {Object} Note
 * @property {string} title - Note title
 * @property {string} content - Note content
 * @property {number} uid - User ID
 */

/**
 * @typedef {Object} User
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} email - User's email
 * @property {string} password - User's password (will be hashed)
 */

// Database connection pool
let pool = null;

/**
 * Create database connection pool
 * @returns {mysql.Pool} MySQL connection pool
 */
const createMysqlDbPool = () => {
    const config = {
        host: 'localhost',
        user: process.env.NODE_ENV === 'production' ? process.env.DATABASE_USER_PROD : process.env.DATABASE_USER,
        password: process.env.NODE_ENV === 'production' ? process.env.DATABASE_PASS_PROD : process.env.DATABASE_PASS,
        database: process.env.NODE_ENV === 'production' ? process.env.DATABASE_NAME_PROD : process.env.DATABASE_NAME,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        debug: process.env.NODE_ENV === 'development'
    };

    // Validate configuration
    const requiredEnvVars = ['DATABASE_USER', 'DATABASE_PASS', 'DATABASE_NAME'];
    if (process.env.NODE_ENV === 'production') {
        requiredEnvVars.push('DATABASE_USER_PROD', 'DATABASE_PASS_PROD', 'DATABASE_NAME_PROD');
    }

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }

    return mysql.createPool(config);
};

/**
 * Execute a database query with error handling and connection management
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} Query results
 */
const asyncQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        if (!pool) {
            return reject(new Error('Database connection not initialized'));
        }

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting database connection:', err);
                return reject(new Error('Unable to connect to database'));
            }

            connection.query(query, params, (error, results) => {
                connection.release(); // Always release the connection

                if (error) {
                    console.error('Query error:', error);
                    return reject(error);
                }

                if (!results) {
                    return reject(new Error('No results returned'));
                }

                resolve(results);
            });
        });
    });
};

/**
 * Create users table if it doesn't exist
 * @returns {Promise<void>}
 */
const createUserTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await asyncQuery(query);
        console.log('Users table created or verified successfully');
    } catch (error) {
        console.error('Error creating users table:', error);
        throw error;
    }
};

/**
 * Create notes table if it doesn't exist
 * @returns {Promise<void>}
 */
const createNoteTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            uid INTEGER NOT NULL,
            FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_notes (uid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await asyncQuery(query);
        console.log('Notes table created or verified successfully');
    } catch (error) {
        console.error('Error creating notes table:', error);
        throw error;
    }
};

/**
 * Create session table if it doesn't exist
 * @returns {Promise<void>}
 */
const createSessionTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS session (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            token VARCHAR(255) UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_token (token),
            INDEX idx_expiry (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await asyncQuery(query);
        console.log('Session table created or verified successfully');
    } catch (error) {
        console.error('Error creating session table:', error);
        throw error;
    }
};

/**
 * Initialize database and create required tables
 * @returns {Promise<void>}
 */
const initializeDatabase = async () => {
    try {
        pool = createMysqlDbPool();
        await createUserTable();
        await createSessionTable();
        await createNoteTable();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
};

/**
 * Get all notes for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array<Note>>} Array of notes
 */
const getAllNotes = async (userId) => {
    if (!userId || typeof userId !== 'number') {
        throw new Error('Invalid user ID');
    }

    const query = `
        SELECT id, title, content, created_at, updated_at 
        FROM notes 
        WHERE uid = ? 
        ORDER BY updated_at DESC
    `;
    return await asyncQuery(query, [userId]);
};

/**
 * Get a specific note by ID for a user
 * @param {number} userId - User ID
 * @param {number} noteId - Note ID
 * @returns {Promise<Note>} Note object
 */
const getNoteById = async (userId, noteId) => {
    if (!userId || !noteId || typeof userId !== 'number' || typeof noteId !== 'number') {
        throw new Error('Invalid user ID or note ID');
    }

    const query = `
        SELECT id, title, content, created_at, updated_at 
        FROM notes 
        WHERE uid = ? AND id = ?
    `;
    const results = await asyncQuery(query, [userId, noteId]);
    return results[0];
};

/**
 * Add a new note
 * @param {Note} note - Note object
 * @returns {Promise<Object>} Result object
 */
const addNote = async (note) => {
    if (!note || !note.title || !note.uid) {
        throw new Error('Invalid note data');
    }

    const query = "INSERT INTO notes (title, content, uid) VALUES (?, ?, ?)";
    return await asyncQuery(query, [note.title, note.content || '', note.uid]);
};

/**
 * Update an existing note
 * @param {number} userId - User ID
 * @param {number} noteId - Note ID
 * @param {Note} note - Updated note data
 * @returns {Promise<Object>} Result object
 */
const updateNoteInDb = async (userId, noteId, note) => {
    if (!userId || !noteId || !note || !note.title) {
        throw new Error('Invalid update data');
    }

    const query = `
        UPDATE notes 
        SET title = ?, content = ? 
        WHERE id = ? AND uid = ?
    `;
    return await asyncQuery(query, [note.title, note.content || '', noteId, userId]);
};

/**
 * Delete a note
 * @param {number} userId - User ID
 * @param {number} noteId - Note ID
 * @returns {Promise<Object>} Result object
 */
const deleteNoteFromDb = async (userId, noteId) => {
    if (!userId || !noteId) {
        throw new Error('Invalid delete parameters');
    }

    const query = 'DELETE FROM notes WHERE uid = ? AND id = ?';
    return await asyncQuery(query, [userId, noteId]);
};

/**
 * Add a new user
 * @param {User} user - User object
 * @returns {Promise<Object>} Result object
 */
const addUser = async (user) => {
    if (!user || !user.firstName || !user.lastName || !user.email || !user.password) {
        throw new Error('Invalid user data');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
        throw new Error('Invalid email format');
    }

    const hashedPass = await bcrypt.hash(user.password, 10);
    const query = "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
    return await asyncQuery(query, [user.firstName, user.lastName, user.email, hashedPass]);
};

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<Array>} Result array
 */
const checkEmail = async (email) => {
    if (!email || typeof email !== 'string') {
        throw new Error('Invalid email');
    }

    const query = 'SELECT 1 FROM users WHERE email = ? LIMIT 1';
    return await asyncQuery(query, [email]);
};

/**
 * Get user information by session token
 * @param {string} token - Session token
 * @returns {Promise<Object>} User information
 */
const getUserByToken = async (token) => {
    if (!token) {
        throw new Error('Invalid token');
    }

    const query = `
        SELECT u.first_name, u.last_name, u.email 
        FROM users u 
        JOIN session s ON s.user_id = u.id 
        WHERE s.token = ? AND s.expires_at > NOW() 
        LIMIT 1
    `;

    const results = await asyncQuery(query, [token]);
    if (!results || results.length === 0) {
        throw new Error('Invalid or expired session');
    }

    return results[0];
};

/**
 * Create a new session
 * @param {string} token - Session token
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Result object
 */
const createSession = async (token, userId) => {
    if (!token || !userId) {
        throw new Error('Invalid session data');
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const query = "INSERT INTO session(token, user_id, expires_at) VALUES(?, ?, ?)";
    return await asyncQuery(query, [token, userId, expiresAt]);
};

/**
 * Get user by email with password for authentication
 * @param {string} email - User email
 * @returns {Promise<Object>} User object
 */
const checkAndGetEmail = async (email) => {
    if (!email) {
        throw new Error('Email is required');
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    const results = await asyncQuery(query, [email]);
    return results[0];
};

/**
 * Validate session token and return user information
 * @param {string} token - Session token
 * @returns {Promise<Object>} User session information
 */
const validate = async (token) => {
    if (!token) {
        throw new Error('Token is required');
    }

    const query = `
        SELECT s.id as session_id, s.user_id, u.first_name, u.last_name, u.email
        FROM session s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > NOW()
        LIMIT 1
    `;

    const results = await asyncQuery(query, [token]);
    if (!results || results.length === 0) {
        return null;
    }

    return results[0];
};

// Clean up expired sessions periodically
setInterval(async () => {
    try {
        await asyncQuery('DELETE FROM session WHERE expires_at < NOW()');
    } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
    }
}, 3600000); // Run every hour

module.exports = {
    initializeDatabase,
    getAllNotes,
    getNoteById,
    addNote,
    updateNoteInDb,
    deleteNoteFromDb,
    addUser,
    checkEmail,
    checkAndGetEmail,
    getUserByToken,
    createSession,
    validate
};