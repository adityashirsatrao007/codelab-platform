# CodeLab - College Coding Platform

A LeetCode-like coding platform built for college students to practice programming problems, improve their algorithmic thinking, and prepare for technical interviews.

![CodeLab Platform](https://via.placeholder.com/800x400?text=CodeLab+Platform)

## Features

- 🎯 **Problem Library** - Curated coding problems with varying difficulties (Easy, Medium, Hard)
- 💻 **Monaco Code Editor** - VS Code's powerful editor with syntax highlighting
- ⚡ **Instant Code Execution** - Run code against test cases with immediate feedback
- 📊 **Submission Tracking** - View your submission history and statistics
- 🏆 **Leaderboard** - Compete with peers and track progress
- 👤 **User Profiles** - Personal profiles with solved problems count
- 🔐 **Authentication** - Secure login and registration system
- 🌙 **Dark Theme** - Beautiful dark interface easy on the eyes

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- TailwindCSS for styling
- Monaco Editor for code editing
- React Router for navigation
- Zustand for state management
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM with SQLite
- JWT Authentication
- Code execution sandbox

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Python 3.x (for Python code execution)
- Git

### Installation

1. **Clone the repository**
   ```bash
   cd Codelab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup the database**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma db seed
   cd ..
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API at http://localhost:3001
   - Frontend at http://localhost:5173

### Default Credentials

After seeding the database, you can use these accounts:

- **Admin**: admin@codelab.com / admin123
- **Student**: student@codelab.com / user123

## Project Structure

```
Codelab/
├── backend/                 # Express API server
│   ├── prisma/             # Database schema and migrations
│   │   ├── schema.prisma   # Prisma schema
│   │   └── seed.ts         # Database seeding
│   └── src/
│       ├── index.ts        # Server entry point
│       ├── middleware/     # Auth and error handling
│       ├── routes/         # API routes
│       └── services/       # Code execution service
│
├── frontend/               # React application
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # React components
│       ├── lib/            # API and store
│       └── pages/          # Page components
│
└── package.json           # Root package.json with workspaces
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Problems
- `GET /api/problems` - List all problems
- `GET /api/problems/:slug` - Get problem details
- `POST /api/problems` - Create problem (admin)
- `PUT /api/problems/:id` - Update problem (admin)

### Submissions
- `POST /api/submissions` - Submit code for evaluation
- `POST /api/submissions/run` - Run code without submitting
- `GET /api/submissions/my` - Get user's submissions
- `GET /api/submissions/:id` - Get submission details

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats/leaderboard` - Get leaderboard

## Adding New Problems

1. Login as admin
2. Use the API or add directly to the seed file
3. Include:
   - Title and description (Markdown supported)
   - Difficulty level
   - Category
   - Starter code for each language
   - Test cases (visible and hidden)

## Supported Languages

- Python 3
- JavaScript (Node.js)
- C++ (g++)

## Security Considerations

- Code execution is isolated with timeouts
- User passwords are hashed with bcrypt
- JWT tokens for authentication
- Input validation on all endpoints

## Future Enhancements

- [ ] Contest mode with timed problems
- [ ] Code discussion and solutions
- [ ] More language support (Java, Go, Rust)
- [ ] Docker-based code isolation
- [ ] Problem difficulty ratings
- [ ] Social features (following, sharing)
- [ ] Admin dashboard for problem management

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this for your college!

---

Built with ❤️ for students who love coding
