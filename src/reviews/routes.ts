import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import type { ReviewCreateInput } from '../../generated/prisma/models'
import { ReviewResultSchema } from '../../generated/zod/schemas'
import { httpError, serverError, zodError } from '../lib/errorUtils'
import { createReviewSchema } from './dto'
import { createReview, findReviewById, removeReview } from './repository'

const postRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createReviewSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Review created',
      content: {
        'application/json': {
          schema: ReviewResultSchema.omit({ book: true }),
        },
      },
    },
    400: zodError,
    500: serverError,
  },
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  request: {
    params: z.object({
      id: z.cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Review deleted',
      content: {
        'application/json': {
          schema: z.object({}),
        },
      },
    },
    400: zodError,
    404: httpError,
    500: serverError,
  },
})

const reviews = new OpenAPIHono()
  .openapi(postRoute, async (c) => {
    const body = c.req.valid('json')
    const data: ReviewCreateInput = {
      book: { connect: { id: body.bookId } },
      rating: body.rating,
      text: body.text,
    }
    const review = await createReview(data)

    return c.json(review)
  })

  .openapi(deleteRoute, async (c) => {
    const id = c.req.param('id')
    const review = await findReviewById(id)
    if (!review) {
      throw new HTTPException(404, {
        message: 'Review not found',
      })
    }
    await removeReview(id)
    return c.json({})
  })

export default reviews
