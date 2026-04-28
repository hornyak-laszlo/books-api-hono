import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { findBookById } from '../books/repository'
import { httpError, serverError, zodError } from '../lib/errorUtils'
import {
  createReviewRequestDto,
  createReviewResponseDto,
  listReviewsResponseDto,
} from './dto'
import {
  createReview,
  findAllReviews,
  findReviewById,
  removeReview,
} from './repository'

const getListRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'Reviews list',
      content: {
        'application/json': {
          schema: listReviewsResponseDto,
        },
      },
    },
    500: serverError,
  },
})

const postRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createReviewRequestDto,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Review created',
      content: {
        'application/json': {
          schema: createReviewResponseDto,
        },
      },
    },
    400: zodError,
    404: httpError,
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
    204: {
      description: 'Review deleted',
    },
    400: zodError,
    404: httpError,
    500: serverError,
  },
})

const reviews = new OpenAPIHono()
  .openapi(getListRoute, async (c) => {
    const reviews = await findAllReviews()
    return c.json(reviews)
  })

  .openapi(postRoute, async (c) => {
    const body = c.req.valid('json')
    const book = await findBookById(body.bookId)
    if (!book) {
      throw new HTTPException(404, {
        message: 'Book not found',
      })
    }
    const review = await createReview({
      bookId: body.bookId,
      rating: body.rating,
      text: body.text,
    })

    return c.json(review, 201)
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
    return c.body(null, 204)
  })

export default reviews
