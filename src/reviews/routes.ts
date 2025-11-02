import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import type { ReviewCreateInput } from '../../generated/prisma/models'
import { ReviewResultSchema } from '../../generated/zod/schemas'
import { createReviewSchema } from './dto'
import { createReview, removeReview } from './repository'

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
    await removeReview(id)
    return c.json({})
  })

export default reviews
