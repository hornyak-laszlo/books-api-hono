import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'

import type { GenreCreateInput } from '../../generated/prisma/models'
import { GenreResultSchema } from '../../generated/zod/schemas'
import { httpError, serverError, zodError } from '../lib/errorUtils'
import { createGenreSchema } from './dto'
import {
  createGenre,
  findAllGenres,
  findGenreById,
  removeGenre,
} from './repository'

const getListRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'Genres list',
      content: {
        'application/json': {
          schema: z.array(GenreResultSchema.omit({ books: true })),
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
          schema: createGenreSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Genre created',
      content: {
        'application/json': {
          schema: GenreResultSchema.omit({ books: true }),
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
      description: 'Genre deleted',
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

const genres = new OpenAPIHono()
  .openapi(getListRoute, async (c) => {
    const genres = await findAllGenres()
    return c.json(genres)
  })

  .openapi(postRoute, async (c) => {
    const body = c.req.valid('json')
    const data: GenreCreateInput = {
      name: body.name,
    }
    const book = await createGenre(data)

    return c.json(book)
  })

  .openapi(deleteRoute, async (c) => {
    const id = c.req.param('id')
    const genre = await findGenreById(id)

    if (!genre) {
      throw new HTTPException(404, {
        message: 'Genre not found',
      })
    }

    await removeGenre(id)
    return c.json({})
  })

export default genres
