# Samay Backend - Timely App Clone

A Fastify-based backend for tracking user activity across devices, built with PostgreSQL and Prisma ORM.

## Features

- 🔐 **Authentication System**: Register, login, logout with JWT tokens
- 🛡️ **Secure Password Hashing**: Using Argon2 for password security
- 📊 **Activity Tracking**: Track user activities with timestamps
- 🔒 **Session Management**: Secure session handling with database storage
- 📚 **API Documentation**: Auto-generated Swagger documentation

## Tech Stack

- **Framework**: Fastify
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Argon2
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI

## Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

**Clone the repository**

```bash
git clone <repository-url>
cd samay-be
```

**Install dependencies**

```bash
npm install
```

**Environment Setup**
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/samaydb"

# JWT Secret (generate a strong secret for production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=3000

# Environment
NODE_ENV=development
```

**Database Setup**

1. Run `npx prisma migrate dev --name init` for the first time
2. Run `npx prisma migrate dev --name added_job_title` from second time
3. For seeding data into db `npx prisma db seed`

**Start Development Server**

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`
