# 🚀 Quick Setup Guide

This guide will help you get both the backend and frontend running.

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally or connection string ready
- Redis running locally (optional for queues)
- npm or yarn

## 🔧 Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required: MONGODB_URI, JWT_SECRET

# Run migrations (if any)
# npm run migrate

# Start development server
npm run dev
```

Backend will run on **http://localhost:3000**

API documentation available at **http://localhost:3000/docs**

## 🎨 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local if needed (default points to localhost:3000)

# Start development server
npm run dev
```

Frontend will run on **http://localhost:3001**

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 Development Workflow

1. **Start Backend**: Open terminal → `cd backend && npm run dev`
2. **Start Frontend**: Open new terminal → `cd frontend && npm run dev`
3. **Both running**: Backend on :3000, Frontend on :3001

## 🔑 Initial Setup Checklist

- [ ] MongoDB is running
- [ ] Redis is running (optional)
- [ ] Backend `.env` configured
- [ ] Backend dependencies installed
- [ ] Backend server starts without errors
- [ ] Frontend `.env.local` configured (optional)
- [ ] Frontend dependencies installed
- [ ] Frontend server starts without errors
- [ ] Can access backend API docs at http://localhost:3000/docs
- [ ] Can access frontend at http://localhost:3001

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Ensure MongoDB is running: `mongosh` or `mongo`
- Check if port 3000 is already in use

### Frontend won't start
- Check if port 3001 is already in use
- Try deleting `node_modules` and reinstalling
- Clear Next.js cache: `rm -rf .next`

### API calls failing from frontend
- Verify backend is running on http://localhost:3000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check browser console for CORS errors

## 📚 Next Steps

- [ ] Read [backend README](./backend/README.md) for API details
- [ ] Read [frontend tasks](./frontend/tasks.md) for development roadmap
- [ ] Set up your IDE with TypeScript support
- [ ] Review [architecture documentation](./README.md#-backend-architecture)

---

**Need help?** Check the main [README.md](./README.md) for detailed information.
