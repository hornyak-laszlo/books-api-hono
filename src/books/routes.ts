import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import type { BookUpdateInput } from '../../generated/prisma/models'
import {
  conflictError,
  httpError,
  serverError,
  zodError,
} from '../lib/errorUtils'
import {
  createBookRequestDto,
  createBookResponseDto,
  getBookResponseDto,
  listBooksResponseDto,
  updateBookRequestDto,
  updateBookResponseDto,
} from './dto'
import {
  createBook,
  findAllBooks,
  findBookById,
  findBookByIsbn,
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
          schema: listBooksResponseDto,
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
          schema: createBookRequestDto,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Book created',
      content: {
        'application/json': {
          schema: createBookResponseDto,
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
      description: 'Book details',
      content: {
        'application/json': {
          schema: getBookResponseDto,
        },
      },
    },
    400: zodError,
    404: httpError,
    500: serverError,
  },
})

const patchRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  request: {
    params: z.object({
      id: z.cuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateBookRequestDto,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Book updated',
      content: {
        'application/json': {
          schema: updateBookResponseDto,
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
      description: 'Book deleted',
    },
    400: zodError,
    404: httpError,
    500: serverError,
  },
})

const books = new OpenAPIHono()
  .openapi(getListRoute, async (c) => {
    const books = await findAllBooks()
    return c.json(books)
  })

  .openapi(postRoute, async (c) => {
    const body = c.req.valid('json')
    const existingBook = await findBookByIsbn(body.isbn)
    if (existingBook) {
      throw new HTTPException(409, {
        message: 'A book with this ISBN already exists',
      })
    }
    const book = await createBook({
      title: body.title,
      isbn: body.isbn,
      publishedAt: body.publishedAt,
      price: body.price,
      inStock: body.inStock,
      genreIds: body.genres,
    })

    return c.json(book, 201)
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
    return c.body(null, 204)
  })

export default books
