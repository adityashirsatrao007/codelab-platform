# CodeLab Project Instructions

## Project Overview

This is a LeetCode-like coding platform for college students with:

- React + TypeScript frontend with Monaco Editor
- Node.js + Express + TypeScript backend
- SQLite database with Prisma ORM
- JWT authentication

## Development Commands

### Start Development

```bash
npm run dev           # Start both frontend and backend
npm run dev:backend   # Start only backend (port 3001)
npm run dev:frontend  # Start only frontend (port 5173)
```

### Database Commands

```bash
cd backend
npx prisma migrate dev    # Run migrations
npx prisma db seed        # Seed with sample data
npx prisma studio         # Open database GUI
```

### Build for Production

```bash
npm run build
```

## Code Style Guidelines

- Use TypeScript strict mode
- Follow ESLint rules
- Use functional React components with hooks
- Use Tailwind CSS for styling
- Keep API routes RESTful

## Architecture

- Frontend uses Zustand for state management
- Backend uses Express middleware pattern
- Code execution is sandboxed with timeouts
- Authentication via JWT tokens stored in localStorage
