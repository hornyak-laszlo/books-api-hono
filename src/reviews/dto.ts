import { z } from '@hono/zod-openapi'

export const createReviewSchema = z
  .object({
    bookId: z.cuid(),
    rating: z.int().min(0).max(10),
    text: z.string().min(1),
  })
  .required()
