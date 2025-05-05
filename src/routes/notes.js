const express = require('express')
const { findAllNotes, updateNote, deleteNote , createNote,getById} = require('../controllers/notes.controller')

const router  = express.Router()

router.get('/notes', findAllNotes)
router.get('/note/:id',getById)
router.post('/note', createNote)
router.patch('/note/:id', updateNote)
router.delete('/note/:id', deleteNote)

module.exports = router