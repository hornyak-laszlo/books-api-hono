import type { Review } from '../../generated/prisma/client'
import type { ReviewCreateInput } from '../../generated/prisma/models'
import prisma from '../lib/prisma'

export const createReview = async (
  data: ReviewCreateInput,
): Promise<Review> => {
  const review = await prisma.review.create({ data })

  return review
}

export const findReviewById = async (id: string): Promise<Review | null> => {
  const review = await prisma.review.findUnique({ where: { id } })
  return review
}

export const removeReview = async (id: string): Promise<void> => {
  await prisma.review.delete({ where: { id } })
}
