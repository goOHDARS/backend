import { RequestWithUser } from '../middleware/validation'
import { Response } from 'express'
import { User, getUser } from './UserController'
import { MajorRequirement, getMajor } from './MajorsController'
import { deleteDoc, filter, getCollection, getDoc, setDoc } from '../utils'
import { COURSE_COLLECTION, MAJOR_COLLECTION, USER_COLLECTION } from '..'

type CourseBrief = {
  id: string
  fullName: string
  shortName: string
  credits: number
  semester: number | null
  category?: string
  subcategory?: string
}

export type Course = {
  id: string
  college: string
  credits: number
  description: string
  fullName: string
  prereq: string[]
  semester: string
  shortName: string
}

export type UserCourse = {
  id: string
  course: string
  semester: number
  category: string
  subcategory?: string
}

export const queryCourses = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const user = await getUser(request.userId)
    const major = await getMajor(user.major)
    const allCourses = await getCollection<Course>(COURSE_COLLECTION)
    const allRequirements = await getCollection<MajorRequirement>(
      `${MAJOR_COLLECTION}/${major.id}/requirements`
    )

    const partialCourseName: string = request.body.search
    const filteredCourses = allCourses.filter((course) =>
      course.shortName.includes(partialCourseName.toUpperCase())
    )

    const filteredRequirements = filteredCourses.map((course) => {
      // @TODO: this only finds the first requirement that fits, it is possible to count as multiple requirements
      const requirement = allRequirements.find((el) =>
        el.course.includes(course.shortName)
      )
      return requirement
    })

    const coursesAndRequirements: CourseBrief[] = []
    for (let i = 0; i < filteredCourses.length; i++) {
      const requirement = filteredRequirements[i]
      const course = filteredCourses[i]

      coursesAndRequirements.push({
        id: course.id,
        fullName: course.fullName,
        shortName: course.shortName,
        credits: course.credits,
        semester: null,
        category: requirement?.category,
        subcategory: requirement?.subcategory,
      })
    }

    response.status(200).send(coursesAndRequirements)
  } catch (err: any) {
    response.status(500).send({ error: err })
  }
}

export const getInitialCourses = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const user = await getUser(request.userId)
    const major = await getMajor(user.major)

    const filters: filter[] = []

    if (user.semester < major.planned_length) {
      filters.push(['priority', '<', major.semester_divisions[user.semester]])
    }

    const requiredCourses = await getCollection<MajorRequirement>(
      `${MAJOR_COLLECTION}/${major.id}/requirements`,
      filters
    )

    //@TODO: except array of courses as valid so that we can add requirements that could have multiple courses
    const courses = await Promise.all(
      requiredCourses.map((el) =>
        getDoc<Course>(COURSE_COLLECTION, [['shortName', '==', el.course[0]]])
      )
    )

    const coursesAndRequirements: CourseBrief[] = []
    for (let i = 0; i < courses.length; i++) {
      const requirement = requiredCourses[i]
      const course = courses[i]

      coursesAndRequirements.push({
        id: course.id,
        fullName: course.fullName,
        shortName: course.shortName,
        credits: course.credits,
        semester: requirement.semester,
        category: requirement.category,
        subcategory: requirement.subcategory,
      })
    }

    response.status(200).send(coursesAndRequirements)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}

export const setInitialCourses = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const user = await getUser(request.userId)
    const coursesInfo: Omit<UserCourse, 'id'>[] = request.body.courses

    await Promise.all(
      coursesInfo.map((el) =>
        setDoc<typeof el>(`${USER_COLLECTION}/${request.userId}/courses`, el)
      )
    )

    await setDoc<User>(USER_COLLECTION, { ...user, onboarded: true })
    response.status(200).send({ status: 'success' })
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}

export const addUserCourse = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const courseInfo: Omit<UserCourse, 'id'> = request.body.course

    await setDoc<Omit<UserCourse, 'id'>>(
      `${USER_COLLECTION}/${request.userId}/courses`,
      courseInfo
    )

    const course = await getDoc<Course>(COURSE_COLLECTION, [
      ['shortName', '==', courseInfo.course],
    ])

    const brief: CourseBrief = {
      id: course.id,
      fullName: course.fullName,
      shortName: course.shortName,
      credits: course.credits,
      semester: courseInfo.semester,
      category: courseInfo.category,
      subcategory: courseInfo.subcategory,
    }

    response.status(200).send(brief)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}

export const removeUserCourse = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const courseName: string = request.body.course
    const { id, course } = await getDoc<UserCourse>(
      `${USER_COLLECTION}/${request.userId}/courses`,
      [['course', '==', courseName]]
    )

    await deleteDoc(`${USER_COLLECTION}/${request.userId}/courses/${id}`)

    response.status(200).send({ courseName: course })
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}

export const getCourseInfo = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const courseName: string = request.body.course

    const course = await getDoc<Course>(COURSE_COLLECTION, [
      ['shortName', '==', courseName],
    ])

    response.status(200).send(course)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}

export const getCourses = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const userCourses = await getCollection<UserCourse>(
      `${USER_COLLECTION}/${request.userId}/courses`
    )

    const courses = await Promise.all(
      userCourses.map((course) =>
        getDoc<Course>(COURSE_COLLECTION, [['shortName', '==', course.course]])
      )
    )

    const courseBriefs: CourseBrief[] = []
    for (let i = 0; i < userCourses.length; i++) {
      const userCourse = userCourses[i]
      const course = courses[i]

      courseBriefs.push({
        id: course.id,
        fullName: course.fullName,
        shortName: course.shortName,
        credits: course.credits,
        semester: userCourse.semester,
        category: userCourse.category,
        subcategory: userCourse.subcategory,
      })
    }

    response.status(200).send(courseBriefs)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}
