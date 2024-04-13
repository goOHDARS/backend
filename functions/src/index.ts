import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import express = require('express')
import { createUser, getCurrentUser } from './controllers/UserController'

export const USER_COLLECTION = 'Users'

const app = express()
admin.initializeApp()
app.use(express.json())

app.get('/get_current_user', getCurrentUser as any)
app.post('/create_user', createUser as any)

exports.api = onRequest(app)
