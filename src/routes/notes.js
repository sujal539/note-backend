const express = require('express')
const { findAllNotes, updateNote, deleteNote , createNote} = require('../controllers/notes.controller')
const { addNote } = require('../../database')

const router  = express.Router()

router.get('/notes', findAllNotes)
router.post('/note', createNote)
router.patch('/note/:id', updateNote)
router.delete('/note/:id', deleteNote)

module.exports = router