import { readFileSync } from 'node:fs'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { serverError } from '../lib/errorUtils'
import prisma from '../lib/prisma'

const postRoute = createRoute({
  method: 'post',
  path: '/',
  responses: {
    200: {
      description: 'Reset DB',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string(),
          }),
        },
      },
    },
    500: serverError,
  },
})

const resetDb = new OpenAPIHono().openapi(postRoute, async (c) => {
  const sql = readFileSync(new URL('../../seed.sql', import.meta.url), 'utf8')

  await prisma.$executeRawUnsafe(sql)

  return c.json({ status: 'ok' })
})

export default resetDb
