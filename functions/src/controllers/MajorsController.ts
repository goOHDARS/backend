import { Request } from 'firebase-functions/v2/https'
import { Response } from 'express'
import * as admin from 'firebase-admin'
import { MAJOR_COLLECTION, USER_COLLECTION } from '..'
import validateFirebaseIdToken from '../middleware/validation'

export const getListOfMajors = async (request: Request, response: Response) => {
  try {
    const majorRefListPromise = await admin
      .firestore()
      .collection(MAJOR_COLLECTION)
      .listDocuments()
    const majorPromises = await Promise.all(
      majorRefListPromise.map((el) => el.get())
    )
    const majors = majorPromises.map((el) => el.data()?.name)

    response.status(200).send(majors)
  } catch (err) {
    response.status(500).send({ error: err })
  }
}

export const getCurrentMajor = async (request: Request, response: Response) => {
  const token = await validateFirebaseIdToken(request, response)
  const uid = token?.uid
  if (!uid) return

  try {
    const majorRefListPromise = await admin
      .firestore()
      .collection(MAJOR_COLLECTION)
      .listDocuments()
    const majorPromises = await Promise.all(
      majorRefListPromise.map((el) => el.get())
    )
    const majors = majorPromises.map((el) => el.data())

    const userPromise = await admin
      .firestore()
      .doc(`${USER_COLLECTION}/${uid}`)
      .get()

    const user = userPromise.data()
    const userMajor = majors.find((el) => el?.name == user?.major)

    if (userMajor) {
      response.status(200).send(userMajor)
    } else {
      response.status(404).send({ error: 'Major Not Found' })
    }
  } catch (err) {
    response.status(500).send({ error: err })
  }
}
