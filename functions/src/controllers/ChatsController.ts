import { RequestWithUser } from '../middleware/validation'
import { Response } from 'express'
import { getDoc, setDoc } from '../utils'
import { CONVERSATION_COLLECTION } from '..'
import { ChatCompletionMessageParam } from 'openai/resources'
import { getInitialPrompts } from '../gptAssets/prompts'
import { getUser } from './UserController'
import { runConversation } from '../gptAssets'

export type Conversation = {
  id: string
  userID: string
  messages: ChatCompletionMessageParam[]
}

export const createConversation = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const user = await getUser(request.userId)
    const conversationID = await setDoc<Omit<Conversation, 'id'>>(
      CONVERSATION_COLLECTION,
      {
        userID: request.userId,
        messages: getInitialPrompts(user),
      }
    )

    const conversation = await getDoc<Conversation>(
      `${CONVERSATION_COLLECTION}/${conversationID}`
    )

    response.status(200).send(conversation)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}

export const getChatResponse = async (
  request: RequestWithUser,
  response: Response
) => {
  try {
    const conversationID: string = request.body.id
    const newMessages: ChatCompletionMessageParam[] = request.body.messages
    const currentConversation = await getDoc<Conversation>(
      `${CONVERSATION_COLLECTION}/${conversationID}`
    )

    const allMessages = currentConversation.messages.concat(newMessages)
    const generatedResponse = await runConversation(request.userId, allMessages)
    const updatedMessages = allMessages.concat(generatedResponse)

    const updatedConversation: Conversation = {
      id: currentConversation.id,
      userID: currentConversation.userID,
      messages: updatedMessages,
    }

    await setDoc<Conversation>(CONVERSATION_COLLECTION, updatedConversation)
    response.status(200).send(generatedResponse)
  } catch (err: any) {
    response.status(500).send({ error: err.message })
  }
}
