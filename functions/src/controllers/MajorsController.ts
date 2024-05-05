import { Request } from 'firebase-functions/v2/https'
import { Response } from 'express'
import * as admin from 'firebase-admin'
import { MAJOR_COLLECTION } from '..'

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
