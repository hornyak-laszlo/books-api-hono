import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import type { GenreCreateInput } from '../../generated/prisma/models'
import { GenreResultSchema } from '../../generated/zod/schemas'
import { createGenreSchema } from './dto'
import { createGenre, findAllGenres, removeGenre } from './repository'

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
    await removeGenre(id)
    return c.json({})
  })

export default genres
