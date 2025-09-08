# Samay backend

This is backend repo for samay application

## Setup

1. Run `npm install` to install dependencies
2. Create `.env` file and copy contents from `.env.example` to run application.
3. Follow db setup section for setting up database.
4. Run `npm run dev` for running application

## DB Setup

1. Install postgres
2. Change db username and password in .env file

## Migration

1. Run `npx prisma migrate dev --name init` for the first time
2. Run `npx prisma migrate dev --name added_job_title` from second time
3. Run `npx prisma migrate dev` to migrate schema

## Swagger docs

1. Swagger docs present at `/docs` endpoint
2. Use swagger for API testing
