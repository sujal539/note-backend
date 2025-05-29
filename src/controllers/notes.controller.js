const {
    getAllNotes,
    addNote,
    updateNoteInDb,
    deleteNoteFromDb,
    getNoteById
} = require('../../database');

// HTTP Status codes for consistent use
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

/**
 * Validates note data
 * @param {Object} note - Note data to validate
 * @returns {Object} - Validation result {isValid: boolean, error: string}
 */
const validateNoteData = (note) => {
    if (!note) {
        return { isValid: false, error: 'Note data is required' };
    }

    if (!note.title || typeof note.title !== 'string' || note.title.trim().length === 0) {
        return { isValid: false, error: 'Title is required and must be a non-empty string' };
    }

    if (!note.content || typeof note.content !== 'string') {
        return { isValid: false, error: 'Content is required and must be a string' };
    }

    // Trim and validate lengths
    const trimmedTitle = note.title.trim();
    const trimmedContent = note.content.trim();

    if (trimmedTitle.length > 255) {
        return { isValid: false, error: 'Title must be less than 255 characters' };
    }

    return {
        isValid: true,
        sanitizedData: {
            title: trimmedTitle,
            content: trimmedContent
        }
    };
};

/**
 * Get all notes for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
// Import the logger
const logger = require('../utils/logger');

const findAllNotes = async (req, res) => {
    try {
        // Log request details
        logger.info('findAllNotes request received', {
            user: req.user,
            cookies: req.cookies,
            headers: req.headers
        });

        const userId = req.user?.userId;

        // Log userId information
        logger.info('User ID extraction', {
            userId,
            type: typeof userId
        });

        if (!userId) {
            logger.warn('User ID missing from request');
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'User ID is required'
            });
        }

        try {
            // Log database call attempt
            logger.info('Attempting to fetch notes', { userId });

            const notes = await getAllNotes(userId);

            // Log successful retrieval
            logger.info('Notes retrieved successfully', {
                userId,
                noteCount: notes?.length
            });

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: notes
            });
        } catch (error) {
            // Log database error with details
            logger.error('Database error in findAllNotes', {
                error: error.message,
                stack: error.stack,
                userId,
                errorCode: error.code,
                sqlMessage: error.sqlMessage
            });

            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: process.env.NODE_ENV === 'development'
                    ? `Failed to fetch notes: ${error.message}`
                    : 'Failed to fetch notes'
            });
        }
    } catch (outer_error) {
        // Log unexpected errors
        logger.error('Unexpected error in findAllNotes', {
            error: outer_error.message,
            stack: outer_error.stack
        });

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occurred'
        });
    }
};

/**
 * Get a specific note by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    const id = Number(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'User ID is required'
        });
    }

    if (!id || isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Valid note ID is required'
        });
    }

    try {
        const note = await getNoteById(userId, id);

        if (!note) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Note not found'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: note
        });
    } catch (error) {
        console.error('Error fetching note:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch note'
        });
    }
};

/**
 * Create a new note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createNote = async (req, res) => {
    const userId = req.user?.userId;
    const noteData = req.body;

    if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'User ID is required'
        });
    }

    const validation = validateNoteData(noteData);
    if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: validation.error
        });
    }

    try {
        const { sanitizedData } = validation;
        await addNote({
            title: sanitizedData.title,
            content: sanitizedData.content,
            uid: userId
        });

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Note created successfully'
        });
    } catch (error) {
        console.error('Error creating note:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create note'
        });
    }
};

/**
 * Delete a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteNote = async (req, res) => {
    const id = Number(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'User ID is required'
        });
    }

    if (!id || isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Valid note ID is required'
        });
    }

    try {
        // First check if the note exists and belongs to the user
        const note = await getNoteById(userId, id);
        if (!note) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Note not found'
            });
        }

        await deleteNoteFromDb(userId, id);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete note'
        });
    }
};

/**
 * Update a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateNote = async (req, res) => {
    const id =
        Number(req.params.id);
    const userId = req.user?.userId;
    const noteData = req.body;

    if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'User ID is required'
        });
    }

    if (!id || isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Valid note ID is required'
        });
    }

    const validation = validateNoteData(noteData);
    if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: validation.error
        });
    }

    try {
        // First check if the note exists and belongs to the user
        const existingNote = await getNoteById(userId, id);
        if (!existingNote) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Note not found'
            });
        }

        const { sanitizedData } = validation;
        await updateNoteInDb(userId, id, {
            title: sanitizedData.title,
            content: sanitizedData.content
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Note updated successfully'
        });
    } catch (error) {
        console.error('Error updating note:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update note'
        });
    }
};

module.exports = {
    createNote,
    updateNote,
    deleteNote,
    findAllNotes,
    getById
};