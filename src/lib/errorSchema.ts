import { z } from '@hono/zod-openapi'

export const errorSchema = z.object({
  success: z.boolean(),
  error: z.object({
    name: z.enum([
      'ValidationError',
      'HttpError',
      'PrismaError',
      'UnknownError',
    ]),
    message: z.string(),
  }),
})
