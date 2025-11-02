import { z } from '@hono/zod-openapi'

export const createBookSchema = z
  .object({
    title: z.string().min(1),
    isbn: z.string().min(1),
    publishedAt: z.coerce.date(),
    price: z.number().min(0.01),
    inStock: z.boolean(),
    genres: z.array(z.cuid()),
  })
  .required()

export const updateBookSchema = z
  .object({
    price: z.number().min(0.01),
    inStock: z.boolean(),
  })
  .required()
