import { Request, Response } from 'express'
import { MAJOR_COLLECTION, USER_COLLECTION } from '..'
import { RequestWithUser } from '../middleware/validation'
import { getCollection, getDoc } from '../utils'
import { User } from './UserController'

export type Major = {
  id: string
  degree: string
  name: string
  planned_length: number
  semester_divisions: number[]
}

export type MajorRequirements = {
  id: string
  category: string
  subcategory: string
  course: string
  priority: number
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
    const user = await getDoc<User>(`${USER_COLLECTION}/${request.userId}`)
    const majors = await getCollection<Major>(MAJOR_COLLECTION)
    const userMajor = majors.find((major) => {
      console.log(`${user.major}, ${major.name}`)
      return major.name === user.major
    })

    if (userMajor) {
      response.status(200).send(userMajor)
    } else {
      response.status(404).send({ error: 'Major Not Found' })
    }
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}
