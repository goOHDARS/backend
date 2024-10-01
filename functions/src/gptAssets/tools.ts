import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from 'openai/resources'
import {
  addUserCourseTool,
  getCourseInfoTool,
  getCoursesTool,
  queryCoursesTool,
  removeUserCourseTool,
} from '../controllers/CoursesController'

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getCourses',
      description: 'get the courses that the user has added to their schedule',
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSuggestions',
      description: 'get recommended courses for the user',
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCourseInfo',
      description: 'get the full information of a course',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'the short name of the course to get info of',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addUserCourse',
      description: 'add the course to the users schedule',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'the short name of the course to add',
          },
          semester: {
            type: 'number',
            description: 'the semester to add the course into',
          },
        },
        required: ['name', 'semester'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'removeUserCourse',
      description: 'remove a course from the users schedule',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'the short name of the course to remove',
          },
        },
        required: ['name'],
      },
    },
  },
]

// a type to represent all of the possible tool calls (should match 'tools')
type FunctionKeys =
  | 'getCourses'
  | 'getSuggestions'
  | 'getCourseInfo'
  | 'addUserCourse'
  | 'removeUserCourse'

// a type to represent all of the possible parameters used in tool calls
type AllParams = Partial<{
  // short name of the course
  name: string
  // semester the user is taking the course
  semester: number
}>

export const generateMessageFromToolCall = async (
  userId: string,
  toolCalls: ChatCompletionMessageToolCall[]
) => {
  const responses: ChatCompletionMessageParam[] = []
  const functionMap: Record<
    FunctionKeys,
    (params: AllParams) => Promise<string>
  > = {
    getCourses: async () => {
      const briefs = (await getCoursesTool(userId)).filter(
        // filter out suggestions
        (el) => !el.suggestion
      )
      return (
        'Below are the courses you are currently enrolled in.\n\n' +
        briefs.map((el) => el.shortName).join('\n') +
        '\n\nPlease let me know if you need anything else.'
      )
    },
    getSuggestions: async () => {
      const suggestions = (await getCoursesTool(userId)).filter(
        // keep only suggestions
        (el) => el.suggestion
      )
      return (
        'Here are some course recommendations for next semester:\n\n' +
        suggestions.map((el) => el.shortName).join('\n') +
        '\n\nPlease let me know if you need anything else.'
      )
    },
    getCourseInfo: async ({ name }) => {
      try {
        const course = await getCourseInfoTool(name ?? '')
        return (
          course.fullName +
          '\n' +
          course.shortName +
          '\nCredits: ' +
          course.credits +
          '\nCollege: ' +
          course.college +
          '\n\n' +
          course.description +
          '\n\nPlease let me know if you need anything else.'
        )
      } catch {
        return `Hmm... I was not able to find ${name}. Make sure you are using its short name. ex: CS2400.`
      }
    },
    addUserCourse: async ({ name, semester }) => {
      const results = await queryCoursesTool(userId, name ?? '')

      if (results.length === 0) {
        return `Hmm... I was not able to find ${name}. Make sure you are using its short name. ex: CS2400.`
      }

      const search = results[0]
      try {
        const brief = await addUserCourseTool(userId, {
          course: search.shortName,
          semester: semester ?? 0,
          category: search.category,
          subcategory: search.subcategory,
        })
        return `Successfully added ${brief.shortName} to your schedule.`
      } catch {
        return `You have already taken ${search.shortName}. Is there another course you would like to add instead?`
      }
    },
    removeUserCourse: async ({ name }) => {
      try {
        const courseName = await removeUserCourseTool(userId, name ?? '')
        return `Successfully removed ${courseName} from your schedule.`
      } catch {
        return `${name} does not exist in your present courses.`
      }
    },
  }

  for (const toolCall of toolCalls) {
    const functionToCall = functionMap[toolCall.function.name as FunctionKeys]
    const functionArgs: AllParams = JSON.parse(toolCall.function.arguments)

    responses.push({
      role: 'assistant',
      content: await functionToCall(functionArgs),
    })
  }

  return responses
}
