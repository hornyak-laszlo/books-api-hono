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
  // Read the SQL file
  const sql = readFileSync('seed.sql', 'utf8')

  // Execute the SQL commands using Prisma's raw query method
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt)
  }
  return c.json({ status: 'ok' })
})

export default resetDb
