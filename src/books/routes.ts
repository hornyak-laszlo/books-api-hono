import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import type {
  BookCreateInput,
  BookUpdateInput,
  GenresOnBooksCreateWithoutBookInput,
} from '../../generated/prisma/models'
import {
  BookResultSchema,
  GenreResultSchema,
  GenresOnBooksModelSchema,
} from '../../generated/zod/schemas'
import { createBookSchema, updateBookSchema } from './dto'
import {
  createBook,
  findAllBooks,
  findBookById,
  removeBook,
  updateBook,
} from './repository'

const getListRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'Books list',
      content: {
        'application/json': {
          schema: z.array(
            BookResultSchema.omit({
              price: true,
              reviews: true,
              genres: true,
            }).extend({
              price: z.string(),
              genres: z.array(
                GenresOnBooksModelSchema.omit({
                  book: true,
                  genre: true,
                }).extend({
                  genre: GenreResultSchema.omit({ books: true }),
                }),
              ),
            }),
          ),
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
          schema: createBookSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Book created',
      content: {
        'application/json': {
          schema: BookResultSchema.omit({
            price: true,
            genres: true,
            reviews: true,
          }).extend({
            price: z.string(),
          }),
        },
      },
    },
  },
})

const getRoute = createRoute({
  method: 'get',
  path: '/:id',
  request: {
    params: z.object({
      id: z.cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Book details',
      content: {
        'application/json': {
          schema: BookResultSchema.omit({
            price: true,
          }).extend({
            price: z.string(),
          }),
        },
      },
    },
  },
})

const patchRoute = createRoute({
  method: 'patch',
  path: '/:id',
  request: {
    params: z.object({
      id: z.cuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateBookSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Book updated',
      content: {
        'application/json': {
          schema: BookResultSchema.omit({
            price: true,
            genres: true,
            reviews: true,
          }).extend({
            price: z.string(),
          }),
        },
      },
    },
  },
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/:id',
  request: {
    params: z.object({
      id: z.cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Book deleted',
      content: {
        'application/json': {
          schema: z.object({}),
        },
      },
    },
  },
})

const books = new OpenAPIHono()
  .openapi(getListRoute, async (c) => {
    const books = await findAllBooks()
    return c.json(books)
  })

  .openapi(postRoute, async (c) => {
    const body = c.req.valid('json')
    const data: BookCreateInput = {
      title: body.title,
      isbn: body.isbn,
      publishedAt: body.publishedAt,
      price: body.price,
      inStock: body.inStock,
      genres: {
        create: body.genres.map(
          (genreId: string): GenresOnBooksCreateWithoutBookInput => ({
            genre: {
              connect: {
                id: genreId,
              },
            },
          }),
        ),
      },
    }
    const book = await createBook(data)

    return c.json(book)
  })

  .openapi(getRoute, async (c) => {
    const id = c.req.param('id')
    const book = await findBookById(id)
    if (!book) {
      throw new HTTPException(404, {
        message: 'Book not found',
      })
    }
    return c.json(book)
  })

  .openapi(patchRoute, async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const book = await findBookById(id)
    if (!book) {
      throw new HTTPException(404, {
        message: 'Book not found',
      })
    }
    const data: BookUpdateInput = {
      price: body.price,
      inStock: body.inStock,
    }
    const updatedBook = await updateBook(id, data)
    return c.json(updatedBook)
  })

  .openapi(deleteRoute, async (c) => {
    const id = c.req.param('id')
    const book = await findBookById(id)
    if (!book) {
      throw new HTTPException(404, {
        message: 'Book not found',
      })
    }
    await removeBook(id)
    return c.json({})
  })

export default books
