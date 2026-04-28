import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'

import {
  conflictError,
  httpError,
  serverError,
  zodError,
} from '../lib/errorUtils'
import {
  createGenreRequestDto,
  createGenreResponseDto,
  listGenresResponseDto,
} from './dto'
import {
  countGenreBooks,
  createGenre,
  findAllGenres,
  findGenreById,
  findGenreByName,
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
          schema: listGenresResponseDto,
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
          schema: createGenreRequestDto,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Genre created',
      content: {
        'application/json': {
          schema: createGenreResponseDto,
        },
      },
    },
    400: zodError,
    409: conflictError,
    500: serverError,
  },
})

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  request: {
    params: z.object({
      id: z.cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Genre details',
      content: {
        'application/json': {
          schema: createGenreResponseDto,
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
      description: 'Genre deleted',
    },
    400: zodError,
    404: httpError,
    409: conflictError,
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
    const existingGenre = await findGenreByName(body.name)
    if (existingGenre) {
      throw new HTTPException(409, {
        message: 'A genre with this name already exists',
      })
    }
    const genre = await createGenre(body.name)

    return c.json(genre, 201)
  })

  .openapi(getRoute, async (c) => {
    const id = c.req.param('id')
    const genre = await findGenreById(id)
    if (!genre) {
      throw new HTTPException(404, {
        message: 'Genre not found',
      })
    }
    return c.json(genre)
  })

  .openapi(deleteRoute, async (c) => {
    const id = c.req.param('id')
    const genre = await findGenreById(id)

    if (!genre) {
      throw new HTTPException(404, {
        message: 'Genre not found',
      })
    }

    const bookCount = await countGenreBooks(id)
    if (bookCount > 0) {
      throw new HTTPException(409, {
        message: 'Cannot delete genre assigned to books',
      })
    }

    await removeGenre(id)
    return c.body(null, 204)
  })

export default genres
