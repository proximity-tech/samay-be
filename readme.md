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

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd samay-be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
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

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

### Available APIs
- **Authentication:** Register, login, logout, and user profile management
- **Database Management:** Visual browser and quick query scripts
- **Health Check:** Server status endpoint

📖 **For detailed API documentation, see:** `docs/API_DOCUMENTATION.md`

## Security Features

- **Password Hashing**: Passwords are hashed using Argon2 (industry standard)
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Tokens are stored in database with expiration
- **Input Validation**: All inputs are validated using Zod schemas
- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: Can be easily added with Fastify plugins

## Database Schema

The application uses the following main models:

- **User**: Stores user information and credentials
- **Session**: Manages active user sessions
- **Activity**: Tracks user activities (for future implementation)

## Development

### Available Scripts

#### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run generate` - Generate Prisma client
- `npm run lint` - Run ESLint

#### Database Management
- `npm run studio` - Start Prisma Studio (visual database browser)
- `npm run db:users` - View all users in database
- `npm run db:sessions` - View all sessions with user info
- `npm run db:count` - Show database statistics

### Project Structure

```
src/
├── index.ts              # Main application entry point
├── middleware/           # Middleware functions
│   ├── auth-middleware.ts
│   ├── routes.ts
│   └── types.ts
├── plugins/              # Fastify plugins
│   └── prisma-plugin.ts
├── routes/               # API routes
│   └── auth-routes.ts
└── services/             # Business logic
    └── auth-service.ts
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Configure a production PostgreSQL database
4. Set up proper CORS origins
5. Add rate limiting and security headers
6. Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Quick Start

### Health Check
```bash
curl http://localhost:3000/health
```

📖 **For detailed testing instructions, see:** `docs/API_DOCUMENTATION.md`

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if database is running
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql@14
```

#### 2. Prisma Issues
```bash
# Reset Prisma client
npm run generate

# Reset database (⚠️ This will delete all data)
npx prisma migrate reset

# View database in Prisma Studio
npm run studio
```

#### 3. Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5555 (Prisma Studio)
lsof -ti:5555 | xargs kill -9
```

#### 4. JWT Token Issues
- Make sure `JWT_SECRET` is set in your `.env` file
- Tokens expire after 7 days
- Use the token from login/register response in Authorization header

📖 **For detailed troubleshooting, see:** `docs/API_DOCUMENTATION.md`

## License

ISC License
