import { z } from '@hono/zod-openapi'

export const createGenreSchema = z
  .object({
    name: z.string().min(1),
  })
  .required()
