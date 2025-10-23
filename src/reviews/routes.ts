import { Hono } from 'hono'
import type { ReviewCreateInput } from '../../generated/prisma/models'
import { createReviewDto } from './dto'
import { createReview, removeReview } from './repository'

const reviews = new Hono()
  .post('/', createReviewDto, async (c) => {
    const body = c.req.valid('json')
    const data: ReviewCreateInput = {
      book: { connect: { id: body.bookId } },
      rating: body.rating,
      text: body.text,
    }
    const book = await createReview(data)

    return c.json(book)
  })

  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    await removeReview(id)
    return c.json({})
  })

export default reviews
