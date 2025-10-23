import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const createReviewSchema = z
  .object({
    bookId: z.cuid(),
    rating: z.int().min(0).max(10),
    text: z.string().min(1),
  })
  .required()

export const createReviewDto = zValidator('json', createReviewSchema)
