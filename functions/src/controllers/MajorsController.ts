import { Request } from 'firebase-functions/v2/https'
import { Response } from 'express'
import * as admin from 'firebase-admin'
import { MAJOR_COLLECTION, USER_COLLECTION } from '..'
import validateFirebaseIdToken from '../middleware/validation'

const getMajors = async () => {
  const majorRefList = await admin
    .firestore()
    .collection(MAJOR_COLLECTION)
    .listDocuments()

  const majorDocs = await Promise.all(
    majorRefList.map((docRef) => docRef.get())
  )
  return majorDocs.map((doc) => doc.data()?.name)
}


export const getListOfMajors = async (request: Request, response: Response) => {
  try {
    const majors = await getMajors()
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
    const majors = await getMajors()

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
