const express = require('express')
const { findAllNotes, updateNote, deleteNote } = require('../controllers/notes.controller')
const { addNote } = require('../../database')

const router  = express.Router()

router.get('/notes', findAllNotes)
router.post('/note', addNote)
router.patch('/note/:id', updateNote)
router.delete('/note/:id', deleteNote)

module.exports = router