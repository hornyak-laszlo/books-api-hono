import type { ResponseConfig } from '@asteasolutions/zod-to-openapi'
import { z } from '@hono/zod-openapi'

export const zodError: ResponseConfig = {
  description: 'Validation error',
  content: {
    'application/json': {
      schema: z.object({
        success: z.boolean(),
        error: z
          .object({
            name: z.literal('ZodError'),
            message: z.string(),
          })
          .strict(),
      }),
    },
  },
}

export const httpError: ResponseConfig = {
  description: 'Http error',
  content: {
    'application/json': {
      schema: z.object({
        name: z.literal('HttpError'),
        message: z.string(),
      }),
    },
  },
}

export const conflictError: ResponseConfig = {
  description: 'Conflict error',
  content: {
    'application/json': {
      schema: z.object({
        name: z.literal('ConflictError'),
        message: z.string(),
      }),
    },
  },
}

export const serverError: ResponseConfig = {
  description: 'Server error',
  content: {
    'application/json': {
      schema: z.object({
        name: z.enum(['PrismaError', 'UnknownError']),
        message: z.string(),
      }),
    },
  },
}
