import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const createBookSchema = z
  .object({
    title: z.string().min(1),
    isbn: z.string().min(1),
    publishedAt: z.coerce.date(),
    price: z.number().min(0.01),
    inStock: z.boolean(),
    genres: z.array(z.cuid()),
  })
  .required()

const updateBookSchema = z
  .object({
    price: z.number().min(0.01),
    inStock: z.boolean(),
  })
  .required()

export const createBookDto = zValidator('json', createBookSchema)
export const updateBookDto = zValidator('json', updateBookSchema)
