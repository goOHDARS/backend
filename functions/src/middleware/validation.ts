import functions = require('firebase-functions/v1')
import admin = require('firebase-admin')
import { Request, Response } from 'express'

export type RequestWithUser = Request & { userId: string }
export type CallBack = (
  request: RequestWithUser,
  response: Response
) => Promise<void>

export const endpointWithAuth = (callback: CallBack) => {
  return async (request: Request, response: Response) => {
    const token = await validateFirebaseIdToken(request, response)

    if (token?.uid) {
      const reqWithUser: RequestWithUser = {
        ...request,
        userId: token.uid,
      } as RequestWithUser
      await callback(reqWithUser, response)
    }
  }
}

const validateFirebaseIdToken = async (req: any, res: any) => {
  functions.logger.log('Check if request is authorized with Firebase ID token')

  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith('Bearer ')) &&
    !(req.cookies && req.cookies.__session)
  ) {
    functions.logger.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.'
    )
    res.status(403).send({ error: 'Unauthorized' })
    return
  }

  let idToken
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    functions.logger.log('Found "Authorization" header')
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else if (req.cookies) {
    functions.logger.log('Found "__session" cookie')
    // Read the ID Token from cookie.
    idToken = req.cookies.__session
  } else {
    // No cookie
    res.status(403).send({ error: 'Unauthorized' })
    return
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken)
    functions.logger.log('ID Token correctly decoded', decodedIdToken)
    return decodedIdToken
  } catch (error) {
    functions.logger.error('Error while verifying Firebase ID token:', error)
    res.status(403).send({ error: 'Unauthorized' })
    return
  }
}
