import { RequestWithUser } from '../middleware/validation'
import { Response } from 'express'
import { User, getCurrentSemester, getUser } from './UserController'
import { MajorRequirement, getMajor } from './MajorsController'
import { deleteDoc, filter, getCollection, getDoc, setDoc } from '../utils'
import { COURSE_COLLECTION, MAJOR_COLLECTION, USER_COLLECTION } from '..'

type CourseBrief = {
  id: string
  fullName: string
  shortName: string
  credits: number
  semester: number | null
  suggestion?: boolean
  category?: string
  subcategory?: string
  priority?: number
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
  category?: string
  subcategory?: string
  priority?: number
}

const MAX_SEMESTER_SIZE = 16

const pickRandomCourse = (
  userCourses: UserCourse[],
  possibleCourses: { name: string; prereq: string[] }[]
) => {
  // filter possible course depending on whether it was
  // not taken and if its prereqs were taken
  const filteredChoices = possibleCourses.filter(
    (course) =>
      !userCourses.find((el) => el.course === course.name) &&
      course.prereq.filter((pr) => !userCourses.find((el) => el.course === pr))
        .length === 0
  )

  if (filteredChoices.length === 0) return undefined

  return filteredChoices[Math.floor(Math.random() * filteredChoices.length)]
    .name
}

export const getCoursesTool = async (userID: string) => {
  const user = await getUser(userID)
  const userMajor = await getMajor(user.major)
  const userCourses = await getCollection<UserCourse>(
    `${USER_COLLECTION}/${userID}/courses`
  )

  // compute next valid semester
  const nextSemester = Math.min(
    userMajor.planned_length - 1,
    getCurrentSemester(user.dateJoined, user.startingSemester) + 1
  )

  // get all reqs
  const requirements = await getCollection<MajorRequirement>(
    `${MAJOR_COLLECTION}/${userMajor.id}/requirements`
  )

  // filter reqs to only ones that have not been met
  const remainingReqs = (
    await Promise.all(
      requirements
        .filter(
          (req) =>
            !userCourses.find((course) => course.priority === req.priority)
        )
        .sort((a, b) => a.priority - b.priority)
        // fill reqs with prereqs for each possible course
        .map(async (req) => ({
          ...req,
          course: await Promise.all(
            req.course.map(async (course) => ({
              name: course,
              prereq: (
                await getDoc<Course>(COURSE_COLLECTION, [
                  ['shortName', '==', course],
                ])
              ).prereq,
            }))
          ),
        }))
    )
  )
    .map((req) => ({
      id: '0',
      // pick random course that has its prereqs met
      course: pickRandomCourse(userCourses, req.course),
      semester: nextSemester,
      category: req.category,
      subcategory: req.subcategory,
      priority: req.priority,
    }))
    .filter((el) => el.course) as UserCourse[]

  // concat suggestions to end of user courses
  const userCoursesAndSuggestions = [...userCourses, ...remainingReqs]
  // find the rest of the course information for each course
  const courses = await Promise.all(
    userCoursesAndSuggestions.map((course) =>
      getDoc<Course>(COURSE_COLLECTION, [['shortName', '==', course.course]])
    )
  )

  const courseBriefs: CourseBrief[] = []
  let totalSemCredits = 0
  for (let i = 0; i < userCoursesAndSuggestions.length; i++) {
    const userCourse = userCoursesAndSuggestions[i]
    const course = courses[i]

    const brief: CourseBrief = {
      id: course.id,
      fullName: course.fullName,
      shortName: course.shortName,
      credits: course.credits,
      semester: userCourse.semester,
      suggestion: userCourse.id === '0' || undefined,
      category: userCourse.category,
      subcategory: userCourse.subcategory,
      priority: userCourse.priority,
    }

    if (!brief.suggestion) {
      courseBriefs.push(brief)
      if (brief.semester === nextSemester) totalSemCredits += brief.credits
    } else {
      totalSemCredits += brief.credits
      if (totalSemCredits <= MAX_SEMESTER_SIZE) {
        courseBriefs.push(brief)
      }
    }
  }

  return courseBriefs
}

export const getCourseInfoTool = async (name: string) => {
  const course = await getDoc<Course>(COURSE_COLLECTION, [
    ['shortName', '==', name.replace(' ', '')],
  ])

  return course
}

export const addUserCourseTool = async (
  userID: string,
  courseInfo: Omit<UserCourse, 'id'>
) => {
  const currentCourses = await getCollection<UserCourse>(
    `${USER_COLLECTION}/${userID}/courses`,
    [['course', '==', courseInfo.course]]
  )

  if (currentCourses.length > 0) {
    throw Error('Course is Already Added')
  }

  const course = await getDoc<Course>(COURSE_COLLECTION, [
    ['shortName', '==', courseInfo.course],
  ])

  await setDoc<Omit<UserCourse, 'id'>>(
    `${USER_COLLECTION}/${userID}/courses`,
    courseInfo
  )

  const brief: CourseBrief = {
    id: course.id,
    fullName: course.fullName,
    shortName: course.shortName,
    credits: course.credits,
    semester: courseInfo.semester,
    category: courseInfo.category,
    subcategory: courseInfo.subcategory,
    priority: courseInfo.priority,
  }

  return brief
}

export const removeUserCourseTool = async (userID: string, name: string) => {
  const { id, course } = await getDoc<UserCourse>(
    `${USER_COLLECTION}/${userID}/courses`,
    [['course', '==', name.replace(' ', '')]]
  )

  await deleteDoc(`${USER_COLLECTION}/${userID}/courses/${id}`)
  return course
}

export const queryCoursesTool = async (userID: string, search: string) => {
  const user = await getUser(userID)
  const major = await getMajor(user.major)
  const allCourses = await getCollection<Course>(COURSE_COLLECTION)
  const allRequirements = await getCollection<MajorRequirement>(
    `${MAJOR_COLLECTION}/${major.id}/requirements`
  )

  const filteredCourses = allCourses.filter((course) =>
    course.shortName.includes(search.toUpperCase().replace(' ', ''))
  )

  const filteredRequirements = filteredCourses.map((course) => {
    // @TODO: this only finds the first requirement that fits,
    // it is possible to count as multiple requirements
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
      priority: requirement?.priority,
    })
  }

  return coursesAndRequirements
}

export const queryCourses = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const partialCourseName: string = request.body.search
    const coursesAndRequirements = await queryCoursesTool(
      request.userId,
      partialCourseName
    )
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
    const semester = getCurrentSemester(user.dateJoined, user.startingSemester)
    const major = await getMajor(user.major)

    const filters: filter[] = []

    if (semester < major.planned_length) {
      filters.push(['priority', '<', major.semester_divisions[semester]])
    }

    const requiredCourses = await getCollection<MajorRequirement>(
      `${MAJOR_COLLECTION}/${major.id}/requirements`,
      filters
    )

    // @TODO: except array of courses as valid so that we can add
    // requirements that could have multiple courses
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
        priority: requirement.priority,
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
    const briefs = await getCoursesTool(request.userId)
    response.status(200).send(briefs)
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
    await addUserCourseTool(request.userId, courseInfo)
    const briefs = await getCoursesTool(request.userId)
    response.status(200).send(briefs)
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
    await removeUserCourseTool(request.userId, courseName)
    const briefs = await getCoursesTool(request.userId)
    response.status(200).send(briefs)
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
    const course = await getCourseInfoTool(courseName)
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
    const courseBriefs = await getCoursesTool(request.userId)
    response.status(200).send(courseBriefs)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}
