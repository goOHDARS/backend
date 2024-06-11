import { config } from 'dotenv'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources'
import { generateMessageFromToolCall, tools } from './tools'

// setup openAI
config()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// use this to make all api calls to openAI
export const runConversation = async (
  userID: string,
  messages: ChatCompletionMessageParam[]
) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    tools,
  })

  const response = completion.choices[0].message
  const toolCalls = completion.choices[0].message.tool_calls

  if (toolCalls) {
    return generateMessageFromToolCall(userID, toolCalls)
  } else {
    return [
      {
        role: response.role,
        content: response.content,
      } as ChatCompletionMessageParam,
    ]
  }
}
