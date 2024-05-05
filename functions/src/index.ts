import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import express = require('express')
import { createUser, getCurrentUser } from './controllers/UserController'
import { getListOfMajors } from './controllers/MajorsController'

export const USER_COLLECTION = 'Users'
export const MAJOR_COLLECTION = 'Majors'

const app = express()
admin.initializeApp()
app.use(express.json())

app.get('/get_current_user', getCurrentUser as any)
app.post('/create_user', createUser as any)

app.get('/get_majors', getListOfMajors as any)

exports.api = onRequest(app)
