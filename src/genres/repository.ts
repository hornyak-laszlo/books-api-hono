import type { Genre } from '../../generated/prisma/client'
import type { GenreCreateInput } from '../../generated/prisma/models'
import prisma from '../lib/prisma'

export const createGenre = async (data: GenreCreateInput) => {
  const genre = await prisma.genre.create({ data })
  return genre
}

export const findAllGenres = async (): Promise<Genre[]> => {
  const genres = await prisma.genre.findMany()
  return genres
}

export const removeGenre = async (id: string): Promise<void> => {
  await prisma.genre.delete({ where: { id } })
}
