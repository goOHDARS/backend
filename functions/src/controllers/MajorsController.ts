import { Request, Response } from 'express'
import { MAJOR_COLLECTION } from '..'
import { RequestWithUser } from '../middleware/validation'
import { getCollection, getDoc } from '../utils'
import { getUser } from './UserController'

export type Major = {
  id: string
  degree: string
  name: string
  planned_length: number
  semester_divisions: number[]
}

export type MajorRequirement = {
  id: string
  category: string
  subcategory?: string
  course: string[]
  priority: number
  semester: number
}

export const getMajor = async (name: string) => {
  const major = await getDoc<Major>(MAJOR_COLLECTION, [['name', '==', name]])
  return major
}

export const getListOfMajors = async (_: Request, response: Response) => {
  try {
    const majors = await getCollection<Major>(MAJOR_COLLECTION)
    const majorsList = majors.map((major) => major.name)
    response.status(200).send(majorsList)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}

export const getCurrentMajor = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const user = await getUser(request.userId)
    const major = await getMajor(user.major)

    response.status(200).send(major)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}
