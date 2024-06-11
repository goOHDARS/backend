import { ChatCompletionMessageParam } from 'openai/resources'
import { User } from '../controllers/UserController'

export const getInitialPrompts = (user: User) => {
  return [userDataPrompt(user)].concat(initialPrompts)
}

const initialPrompts: ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content:
      'You are a chat bot assistant for the Ohio University goDARS mobile app. ' +
      'This app strives to help its students plan their college courses with less ' +
      'trouble than regular DARS.',
  },
  {
    role: 'system',
    content:
      'Strictly sway the user towards only conversations or ' +
      'questions about Ohio University or conversations leading to tool calls ' +
      'as that is the point of this chat bot. Do not assume any parameters for ' +
      'tool calls, prompt the user if they did not provide them and ask again if not sure.',
  },
  { role: 'assistant', content: 'Hello, what can I help you with?' },
]

const userDataPrompt = (user: User) =>
  ({
    role: 'system',
    content:
      'Use this user infomation if needed. ' +
      `Name: ${user.name}, Major: ${user.major}, Semester: ${user.semester}, PID: ${user.pid}`,
  } as ChatCompletionMessageParam)
