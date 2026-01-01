# 🏃 Run Guide: Own HRMS Project

This guide provides step-by-step instructions to clone, configure, and run the HRMS project on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker** (For MongoDB and Redis)
- **Git**

---

## 1. 📥 Cloning the Repository

Open your terminal and run:

```bash
git clone <repository-url>
cd own-hrms-project
```

---

## 2. 🐳 Database & Cache Setup (Docker)

The project requires **MongoDB** and **Redis**. You can run these easily using Docker.

### Run MongoDB
```bash
docker run -d --name hrms-mongo -p 27017:27017 mongo:latest
```

### Run Redis
```bash
docker run -d --name hrms-redis -p 6379:6379 redis:latest
```

*Note: The project is configured to look for Mongo at `localhost:27017` and Redis at `localhost:6379`.*

---

## 3. ⚙️ Backend Setup

Move to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### Configure Environment Variables
Create a `.env` file in the `backend` folder:

```bash
# Example .env content
PORT=3000
MONGODB_URI=mongodb://localhost:27017/enterprise-hrms
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Seed the Database (CRITICAL)
Since a fresh Docker container has no data, you **must** run this command. It populates the database with:
- A Default Organization
- A Super Admin account (so you can log in)
- Salary structures and other templates

```bash
npm run seed
```

### Start Backend Development Server
```bash
npm run dev
```

---

## 4. 🎨 Frontend Setup

Open a new terminal window, move to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

### Configure Environment Variables
Create a `.env.local` file in the `frontend` folder:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_ENV=development
```

### Start Frontend Development Server
```bash
npm run dev
```
The frontend will be running at `http://localhost:3001`.

---

## 🔐 First Time Login

After you have run `npm run seed`, the website will work exactly like the original. You can log in using the default Super Admin credentials:

- **Email**: `superadmin@nexus.com` (or the email specified in `backend/seed.ts`)
- **Password**: `Admin@123`

---

## 💡 How the "Credentials" Work

You might wonder how the website will work without the original `.env` files:

1.  **Database Connection**: By running the Docker commands, the app connects to *your local* Mongo. The `seed` script then builds the exact same "world" (users, roles, departments) that the original developer had.
2.  **App Credentials (Cloudinary/Email)**: 
    - For features like **Document Upload**, the new developer will need to enter their own Cloudinary API keys in their local `.env`.
    - If they don't provide these, the website will still run and you can browse everything, but the specific "Upload" button might fail.
    - **Recommendation**: Create a free Cloudinary account for local testing if you need to test file uploads.

---

## ⚠️ Important Notes

### Git Ignore
The project contains several `.gitignore` files. This is a security feature to ensure that "Secrets" (like your personal 12-digit Cloudinary key) are never uploaded to GitHub. Every developer is expected to provide their own "Secrets" for their own local testing.

### Port Specifications
- **Backend API**: 3000
- **Frontend App**: 3001
- **MongoDB**: 27017
- **Redis**: 6379

---

## 🛠️ Troubleshooting

- **MongoDB Connection Error**: Ensure the Docker container is running and port 27017 is not in use by another service.
- **Redis Connection Error**: Bull queues require Redis. Ensure the Redis container is healthy.
- **Module Not Found**: If you see "Module not found", try deleting `node_modules` and running `npm install` again.
- **Environment Blocked**: Remember that `.env` files are ignored by Git. You MUST create them locally for the app to function.
