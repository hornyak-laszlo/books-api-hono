import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const createGenreSchema = z
  .object({
    name: z.string().min(1),
  })
  .required()

export const createGenreDto = zValidator('json', createGenreSchema)
