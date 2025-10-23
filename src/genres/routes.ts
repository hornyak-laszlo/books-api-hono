import { Hono } from 'hono'
import type { GenreCreateInput } from '../../generated/prisma/models'
import { createGenreDto } from './dto'
import { createGenre, findAllGenres, removeGenre } from './repository'

const genres = new Hono()
  .get('/', async (c) => {
    const genres = await findAllGenres()
    return c.json(genres)
  })

  .post('/', createGenreDto, async (c) => {
    const body = c.req.valid('json')
    const data: GenreCreateInput = {
      name: body.name,
    }
    const book = await createGenre(data)

    return c.json(book)
  })

  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    await removeGenre(id)
    return c.json({})
  })

export default genres
