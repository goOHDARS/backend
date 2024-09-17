import { RequestWithUser } from '../middleware/validation'
import { Response } from 'express'
import { USER_COLLECTION } from '..'
import { deleteDoc, getDoc, setDoc } from '../utils'
import dayjs = require('dayjs')

export type User = {
  id: string
  email: string
  major: string
  name: string
  onboarded: boolean
  pid: string
  startingSemester: number
  dateJoined: string
  photoURL: string
  borderURLColor: string
}

export const getUser = async (uid: string) => {
  const user = await getDoc<User>(`${USER_COLLECTION}/${uid}`)
  return user
}

export const getCurrentSemester = (
  dateJoined: string,
  startingSemester: number
) => {
  const date = dayjs(dateJoined)
  const current = dayjs()
  const monthJoined = date.month()
  const currentMonth = current.month()
  // floor to start of semester
  const flooredDate = date.set('month', monthJoined >= 7 ? 7 : 0).set('date', 1)
  // floor to start of semester
  const flooredCurrent = current
    .set('month', currentMonth >= 7 ? 7 : 0)
    .set('date', 1)

  // convert month diff to year diff + remainder months
  let monthDiff = flooredCurrent.diff(flooredDate, 'month')
  let yearDiff = 0
  while (monthDiff >= 12) {
    monthDiff -= 12
    yearDiff++
  }

  return startingSemester + 2 * yearDiff + (monthDiff !== 0 ? 1 : 0)
}

export const getCurrentYear = (
  dateJoined: string,
  startingSemester: number
) => {
  const currentSemester = getCurrentSemester(dateJoined, startingSemester)
  return Math.ceil(currentSemester / 2)
}

export const getCurrentUser = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const user = await getUser(request.userId)
    const userWithYearAndSemester = {
      ...user,
      startingSemester: undefined,
      dateJoined: undefined,
      semester: getCurrentSemester(user.dateJoined, user.startingSemester),
      year: getCurrentYear(user.dateJoined, user.startingSemester),
    }
    response.status(200).send(userWithYearAndSemester)
  } catch {
    response.status(404).send({ error: 'User Not Found' })
  }
}

export const updateUser = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const user = await getUser(request.userId)

    const data = request.body

    const userInfo : User = {
      id: request.userId,
      name: data.name,
      major: data.major,
      email: data.email,
      startingSemester: user.startingSemester,
      dateJoined: user.dateJoined,
      pid: data.pid,
      onboarded: data.onboarded,
      photoURL: data.photoURL,
      borderURLColor: data.borderURLColor,
    }

    await setDoc<User>(USER_COLLECTION, userInfo)

    response.status(200).send({
      ...userInfo,
      startingSemester: undefined,
      dateJoined: undefined,
      semester: getCurrentSemester(userInfo.dateJoined, userInfo.startingSemester),
      year: getCurrentYear(userInfo.dateJoined, userInfo.startingSemester),
    })
  } catch (error: any) {
    response.status(500).send({ error: error.message})
  }
}

export const createUser = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const data = request.body

    const pokemonResponse = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${
        Math.floor(Math.random() * 1025) + 1
      }`
    )
    const pokemon = await pokemonResponse.json()

    if (!pokemon) {
      response.status(500).send({ error: 'Poke API not OK' })
      return
    }

    const userInfo: User = {
      id: request.userId,
      name: data.name,
      major: data.major,
      email: data.email,
      pid: data.pid,
      startingSemester: data.startingSemester,
      dateJoined: dayjs().format('YYYY/MM/DD'),
      onboarded: false,
      photoURL:
        pokemon?.sprites.front_default ??
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      borderURLColor: 'black',
    }
    await setDoc<User>(USER_COLLECTION, userInfo)

    const userWithYearAndSemester = {
      ...userInfo,
      startingSemester: undefined,
      dateJoined: undefined,
      semester: getCurrentSemester(
        userInfo.dateJoined,
        userInfo.startingSemester
      ),
      year: getCurrentYear(userInfo.dateJoined, userInfo.startingSemester),
    }
    response.status(200).send(userWithYearAndSemester)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}

export const deleteUser = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    await deleteDoc(`${USER_COLLECTION}/${request.userId}`)
    response.status(200).send({ message: 'User deleted' })
  } catch (error: any) {
    response.status(500).send({ error: error.message })
  }
}
