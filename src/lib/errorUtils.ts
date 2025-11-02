/** biome-ignore-all lint/suspicious/noExplicitAny: <Global openapi did not work> */
import { z } from '@hono/zod-openapi'

export const zodError = {
  description: 'Validation error',
  content: {
    'application/json': {
      schema: z.object({
        success: z.boolean(),
        error: z.object({
          name: z.literal('ZodError'),
          message: z.string(),
        }),
      }),
    },
  },
} as any

export const httpError = {
  description: 'Http error',
  content: {
    'application/json': {
      schema: z.object({
        name: z.literal('HttpError'),
        message: z.string(),
      }),
    },
  },
} as any

export const serverError = {
  description: 'Server error',
  content: {
    'application/json': {
      schema: z.object({
        name: z.enum(['PrismaError', 'UnknownError']),
        message: z.string(),
      }),
    },
  },
} as any
