import { RequestWithUser } from '../middleware/validation'
import { Response } from 'express'
import { USER_COLLECTION } from '..'
import { getDoc, setDoc } from '../utils'

export type User = {
  id: string
  email: string
  major: string
  name: string
  onboarded: boolean
  pid: string
  semester: number
  year: number
}

export const getUser = async (uid: string) => {
  const user = await getDoc<User>(`${USER_COLLECTION}/${uid}`)
  return user
}

export const getCurrentUser = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const user = await getUser(request.userId)
    response.status(200).send(user)
  } catch {
    response.status(404).send({ error: 'User Not Found' })
  }
}

export const createUser = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const data = request.body
    const userInfo: User = {
      id: request.userId,
      name: data.name,
      major: data.major,
      email: data.email,
      pid: data.pid,
      year: data.year,
      semester: data.semester,
      onboarded: data.onboarded,
    }

    await setDoc<User>(USER_COLLECTION, userInfo)
    response.status(200).send(userInfo)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}
