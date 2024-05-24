import { Request } from 'firebase-functions/v2/https'
import validateFirebaseIdToken from '../middleware/validation'
import { Response } from 'express'
import * as admin from 'firebase-admin'
import { USER_COLLECTION } from '..'

const getUserUid = async (request: Request, response: Response) => {
  const token = await validateFirebaseIdToken(request, response);
  return token?.uid;
}

export const getCurrentUser = async (request: Request, response: Response) => {
  const uid = await getUserUid(request, response);
  if (!uid) return

  try {
    const userPromise = await admin
      .firestore()
      .doc(`${USER_COLLECTION}/${uid}`)
      .get()
    const userData = userPromise.data()
    response.status(200).send(userData)
  } catch {
    response.status(404).send({ error: 'User Not Found' })
  }
}

export const createUser = async (request: Request, response: Response) => {
  const uid = await getUserUid(request, response);
  const data = request.body
  if (!uid) return

  const userInfo = {
    name: data.name,
    major: data.major,
    email: data.email,
    pid: data.pid,
    year: data.year,
    onboarded: data.onboarded,
  }

  try {
    await admin.firestore().doc(`${USER_COLLECTION}/${uid}`).set(userInfo)
    response.status(200).send(userInfo)
  } catch (err) {
    response.status(500).send({ error: err })
  }
}
