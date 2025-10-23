import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type {
  BookCreateInput,
  BookUpdateInput,
  GenresOnBooksCreateWithoutBookInput,
} from '../../generated/prisma/models'
import { createBookDto, updateBookDto } from './dto'
import {
  createBook,
  findAllBooks,
  findBookById,
  removeBook,
  updateBook,
} from './repository'

const books = new Hono()
  .get('/', async (c) => {
    const books = await findAllBooks()
    return c.json(books)
  })

  .post('/', createBookDto, async (c) => {
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

  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const book = await findBookById(id)
    if (!book) {
      throw new HTTPException(404, {
        message: 'Book not found',
      })
    }
    return c.json(book)
  })

  .patch('/:id', updateBookDto, async (c) => {
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

  .delete('/:id', async (c) => {
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
