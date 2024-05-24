import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as express from 'express'
import { createUser, getCurrentUser } from './controllers/UserController'
import {
  getCurrentMajor,
  getListOfMajors,
} from './controllers/MajorsController'
import { endpointWithAuth } from './middleware/validation'

export const USER_COLLECTION = 'Users'
export const MAJOR_COLLECTION = 'Majors'

const app = express()
admin.initializeApp()
app.use(express.json())

app.get('/get_current_user', endpointWithAuth(getCurrentUser))
app.post('/create_user', endpointWithAuth(createUser))

app.get('/get_majors', getListOfMajors)
app.get('/get_current_major', endpointWithAuth(getCurrentMajor))

exports.api = onRequest(app)
