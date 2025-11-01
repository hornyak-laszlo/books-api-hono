import { readFileSync } from 'node:fs'
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import books from './books/routes'
import genres from './genres/routes'
import prisma from './lib/prisma'
import reviews from './reviews/routes'

const app = new Hono()

app.use(logger())
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

const routes = app
app.route('/books', books)
app.route('/reviews', reviews)
app.route('/genres', genres)
app.post('/reset-db', async (c) => {
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

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error('HTTP ERROR')
    return err.getResponse()
  }

  if (
    err instanceof PrismaClientKnownRequestError ||
    err instanceof PrismaClientUnknownRequestError ||
    err instanceof PrismaClientValidationError ||
    err instanceof PrismaClientInitializationError ||
    err instanceof PrismaClientRustPanicError
  ) {
    console.error('PRISMA ERROR', err)
    return c.text(err.message, 500)
  }

  console.error('UNKOWN ERROR')
  console.error(err.message)
  return c.text(err.message, 500)
})

export type AppType = typeof routes
export const server = Bun.serve({
  port: Number.parseInt(process.env.PORT || '3000', 10),
  fetch: app.fetch,
})
