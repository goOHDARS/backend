import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as express from 'express'
import { createUser, getCurrentUser } from './controllers/UserController'
import {
  getCurrentMajor,
  getListOfMajors,
} from './controllers/MajorsController'
import { endpointWithAuth } from './middleware/validation'
import {
  addUserCourse,
  getCourseInfo,
  getCourses,
  getInitialCourses,
  removeUserCourse,
  setInitialCourses,
} from './controllers/CoursesController'

export const USER_COLLECTION = 'Users'
export const MAJOR_COLLECTION = 'Majors'
export const COURSE_COLLECTION = 'Courses'

const app = express()
admin.initializeApp()
app.use(express.json())

app.get('/get_current_user', endpointWithAuth(getCurrentUser))
app.post('/create_user', endpointWithAuth(createUser))

app.get('/get_majors', getListOfMajors)
app.get('/get_current_major', endpointWithAuth(getCurrentMajor))

app.get('/get_initial_courses', endpointWithAuth(getInitialCourses))
app.post('/set_initial_courses', endpointWithAuth(setInitialCourses))
app.get('/get_courses', endpointWithAuth(getCourses))

app.post('/add_user_course', endpointWithAuth(addUserCourse))
app.delete('/remove_user_course', endpointWithAuth(removeUserCourse))
app.post('/get_course_info', endpointWithAuth(getCourseInfo))

exports.api = onRequest(app)
