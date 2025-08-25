# Samay backend

## Env setup

1. Create .env file
2. Copy paster data from .env.example file to .env

## DB Setup

1. Install Postgres
2. Create Postgres URL
3. Update DATABASE_URL with Postgres URL

## Prisma Migrations

1. Run `npx prisma migrate dev --name init` for the first time
2. Run `npx prisma migrate dev --name added_job_title` from second time
3. For seeding data into db `npx prisma db seed`

## Setup

1. Run `npm install` to install application
2. Run `npm run dev` to run application
3. Check other commands we support package.json

## Swagger

1. We have swagger link at `/docs`
2. Navigate to `/docs` to the APIs
