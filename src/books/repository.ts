import type {
  Book,
  Genre,
  GenresOnBooks,
  Review,
} from '../../generated/prisma/client'
import type {
  BookCreateInput,
  BookUpdateInput,
} from '../../generated/prisma/models'
import prisma from '../lib/prisma'

export const createBook = async (data: BookCreateInput): Promise<Book> => {
  const book = await prisma.book.create({ data })
  return book
}

export const findAllBooks = async (): Promise<
  (Book & { genres: (GenresOnBooks & { genre: Genre })[] })[]
> => {
  const books = await prisma.book.findMany({
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
    },
  })

  return books
}

export const findBookById = async (
  id: string,
): Promise<
  | (Book & {
      reviews: Review[]
      genres: (GenresOnBooks & { genre: Genre })[]
    })
  | null
> => {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      reviews: true,
      genres: {
        include: {
          genre: true,
        },
      },
    },
  })
  return book
}

export const updateBook = async (
  id: string,
  data: BookUpdateInput,
): Promise<Book> => {
  const book = await prisma.book.update({
    where: { id },
    data,
  })
  return book
}

export const removeBook = async (id: string): Promise<void> => {
  await prisma.book.delete({ where: { id } })
}
