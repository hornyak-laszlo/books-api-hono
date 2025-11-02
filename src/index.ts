import { readFileSync } from 'node:fs'
import { OpenAPIHono } from '@hono/zod-openapi'
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import books from './books/routes'
import genres from './genres/routes'
import prisma from './lib/prisma'
import reviews from './reviews/routes'

const app = new OpenAPIHono()

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
    return c.json(
      {
        success: false,
        error: {
          name: 'HttpError',
          message: err.message,
        },
      },
      err.status,
    )
  }

  if (
    err instanceof PrismaClientKnownRequestError ||
    err instanceof PrismaClientUnknownRequestError ||
    err instanceof PrismaClientValidationError ||
    err instanceof PrismaClientInitializationError ||
    err instanceof PrismaClientRustPanicError
  ) {
    console.error('PRISMA ERROR')
    return c.json(
      {
        success: false,
        error: {
          name: 'PrismaError',
          message: err.message,
        },
      },
      500,
    )
  }

  console.error('UNKOWN ERROR')
  console.error(err.message)
  return c.json(
    {
      success: false,
      error: {
        name: 'UknownError',
        message: err.message,
      },
    },
    500,
  )
})

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'Books API',
    version: '1.0.0',
  },
})

app.get('/redoc', (c) => {
  const redocHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>API Docs</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body { margin: 0; padding: 0; }</style>
      </head>
      <body>
        <redoc spec-url='/doc'></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `
  return c.html(redocHtml)
})

export type AppType = typeof routes
export const server = Bun.serve({
  port: Number.parseInt(process.env.PORT || '3000', 10),
  fetch: app.fetch,
})
