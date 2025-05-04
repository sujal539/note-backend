const { getAllNotes, addNote, updateNoteInDb, deleteNoteFromDb } = require('../../database')
const findAllNotes = async (req, res) => {
    const userId = req.user.user_id

    try {
        const notes = await getAllNotes(userId)
        return res.status(200).json(notes)
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const createNote = async (req, res) => {
    const userId = req.user.user_id
    const body = req.body
    try {
        if (!body || !body.title || !body.content) {
            return res.status(400).json({ error: 'all fields are required' })
        }
        await addNote({ title: body.title, content: body.content, uid: userId })

        return res.status(200).json({ message: 'Success' })
    } catch (error) {
        return res.status(500).json({ message: "Internal server errro" })
    }
}

const deleteNote = async (req, res) => {
    const id = req.params.id;
    const userId = req.user.user_id
    const body = req.body
    try {
        if (!body || !body.title || !body.content) {
            return res.status(400).json({ error: 'all fields are required' })
        }
        await deleteNoteFromDb(userId, id)

        return res.status(200).json({ message: 'Success' })
    } catch (error) {
        return res.status(500).json({ message: "Internal server errro" })
    }
}

const updateNote = async (req, res) => {
    const id = req.params.id;
    const userId = req.user.user_id
    const body = req.body
    try {
        if (!body || !body.title || !body.content) {
            return res.status(400).json({ error: 'all fields are required' })
        }
        await updateNoteInDb({ title: body.title, content: body.content, uid: userId })

        return res.status(200).json({ message: 'Success' })
    } catch (error) {
        return res.status(500).json({ message: "Internal server errro" })
    }
}

module.exports = {createNote, updateNote, deleteNote, findAllNotes}