# CourseMate Server

> The backend API powering CourseMate — an intelligent academic advising platform for universities.
>
> [![Live API](https://img.shields.io/badge/Live%20API-coursemate--server--3a4x.onrender.com-brightgreen?style=flat-square)](https://coursemate-server-3a4x.onrender.com/)
> [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
> [![Express](https://img.shields.io/badge/Express-5.x-black?style=flat-square&logo=express)](https://expressjs.com/)
> [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?style=flat-square&logo=mongodb)](https://mongoosejs.com/)
> [![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg?style=flat-square)](https://opensource.org/licenses/ISC)
>
> ---
>
> ## Table of Contents
>
> - [Overview](#overview)
> - [Live Deployment](#live-deployment)
>   - - [Tech Stack](#tech-stack)
>     - - [Architecture](#architecture)
>       - - [Features](#features)
>         - - [API Modules](#api-modules)
>           - - [Getting Started](#getting-started)
>             - - [Environment Variables](#environment-variables)
>               - - [Scripts](#scripts)
>                 - - [Testing](#testing)
>                   - - [API Documentation](#api-documentation)
>                     - - [Project Structure](#project-structure)
>                       - - [Contributors](#contributors)
>                        
>                         - ---
>
> ## Overview
>
> CourseMate Server is a RESTful API built with **Node.js**, **Express 5**, **TypeScript**, and **MongoDB**. It serves as the backbone of the CourseMate academic platform, managing student data, course registration, AI-powered recommendations, academic plans, schedules, notifications, and more.
>
> The server integrates **LangChain** with **Google Generative AI (Gemini)** to deliver intelligent course recommendations and a RAG-based (Retrieval-Augmented Generation) knowledge base assistant for students and supervisors.
>
> ---
>
> ## Live Deployment
>
> | Environment | URL |
> |-------------|-----|
> | Production API | [https://coursemate-server-3a4x.onrender.com](https://coursemate-server-3a4x.onrender.com) |
> | Swagger UI Docs | [https://coursemate-server-3a4x.onrender.com/api-docs](https://coursemate-server-3a4x.onrender.com/api-docs) |
> | Frontend App | [https://coursemate.xyz](https://coursemate.xyz) |
>
> ---
>
> ## Tech Stack
>
> | Layer | Technology |
> |-------|-----------|
> | **Runtime** | Node.js (ESM) |
> | **Language** | TypeScript 5.x |
> | **Framework** | Express 5.x |
> | **Database** | MongoDB via Mongoose 9.x |
> | **Authentication** | JWT + Passport.js + Google OAuth 2.0 |
> | **AI / LLM** | LangChain + Google Generative AI (Gemini) |
> | **RAG Pipeline** | LangChain + PDF-Parse + Text Splitters |
> | **Validation** | Zod |
> | **API Docs** | Swagger (swagger-jsdoc + swagger-ui-express) |
> | **File Uploads** | Multer |
> | **Logging** | Morgan |
> | **Security** | Helmet + CORS |
> | **Testing** | Vitest + Supertest + mongodb-memory-server + MSW |
>
> ---
>
> ## Architecture
>
> The server follows a **feature-based (horizontal) folder structure**, where each domain concern is fully encapsulated in its own module with dedicated routes, controllers, services, models, and schemas.
>
> ```
> src/
> ├── config/           # Database connection & environment config
> ├── features/         # Feature modules (see below)
> ├── shared/           # Middlewares, types, utilities
> │   ├── middlewares/
> │   ├── types/
> │   └── utils/
> └── seed.ts           # Database seeding script
> ```
>
> ---
>
> ## Features
>
> - **Authentication & Authorization** — JWT-based auth with Google OAuth 2.0 SSO support and role-based access control (Student, Supervisor, Admin)
> - - **Course Management** — Full CRUD for courses, sections, departments, and enrollment
>   - - **Academic Planning** — Personalized academic plan generation and management per student
>     - - **Academic Warnings** — Automated detection and management of students at academic risk
>       - - **Important Dates** — University-wide important dates and deadlines management
>         - - **Analytics & Reports** — Aggregated statistics and performance reports for admins and supervisors
>           - - **Notifications** — Real-time notification system for students and staff
>             - - **AI Recommendations** — LLM-powered course recommendations tailored to each student's academic history
>               - - **AI Chat (RAG)** — Retrieval-Augmented Generation assistant trained on university documents (PDFs)
>                 - - **Knowledge Base** — Document upload and management to feed the RAG pipeline
>                   - - **Schedule Management** — Weekly schedule generation and conflict detection
>                    
>                     - ---
>
> ## API Modules
>
> | Module | Description |
> |--------|-------------|
> | `auth` | Login, logout, Google OAuth, token refresh |
> | `user` | User profiles, roles, student/supervisor management |
> | `course` | Course CRUD, prerequisites, credit hours |
> | `course-section` | Section creation, capacity, enrollment |
> | `department` | Department management |
> | `academic-plan` | Student academic plan generation & tracking |
> | `academic-rule` | University academic rules and policies |
> | `academic-warning` | Warning issuance and tracking |
> | `schedule` | Weekly schedule management |
> | `important-dates` | Key academic calendar dates |
> | `analytics` | Performance metrics and reports |
> | `notification` | Push notifications and alerts |
> | `ai` | AI chat endpoint (RAG-based assistant) |
> | `ai-recommendation` | Personalized course recommendation engine |
> | `knowledge-base` | Document uploads to power the AI assistant |
>
> ---
>
> ## Getting Started
>
> ### Prerequisites
>
> - Node.js >= 18
> - - MongoDB instance (local or Atlas)
>   - - Google OAuth credentials (for SSO)
>     - - Google Generative AI API key (for AI features)
>      
>       - ### Installation
>      
>       - ```bash
>         # Clone the repository
>         git clone https://github.com/Mais-A-A/CourseMate-Server.git
>         cd CourseMate-Server
>
>         # Install dependencies
>         npm install
>
>         # Build TypeScript
>         npm run build
>
>         # (Optional) Seed the database
>         npm run seed
>         ```
>
> ### Running the Server
>
> ```bash
> # Development (with nodemon)
> npm run start:dev
>
> # Production
> npm run start:prod
> ```
>
> ---
>
> ## Environment Variables
>
> Create a `.env.development` and `.env.production` file in the root. Required variables:
>
> ```env
> # Server
> PORT=5000
> NODE_ENV=development
>
> # Database
> MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/coursemate
>
> # Authentication
> JWT_SECRET=your_jwt_secret
> JWT_EXPIRES_IN=7d
>
> # Google OAuth
> GOOGLE_CLIENT_ID=your_google_client_id
> GOOGLE_CLIENT_SECRET=your_google_client_secret
> GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
>
> # Google Generative AI (Gemini)
> GOOGLE_GENAI_API_KEY=your_gemini_api_key
>
> # Frontend
> CLIENT_URL=http://localhost:5173
> ```
>
> ---
>
> ## Scripts
>
> | Script | Description |
> |--------|-------------|
> | `npm run build` | Compile TypeScript to JavaScript |
> | `npm run start:dev` | Start server in development mode (nodemon) |
> | `npm run start:prod` | Start server in production mode |
> | `npm run seed` | Seed the database with initial data |
> | `npm run test:unit` | Run unit tests (mocked dependencies) |
> | `npm run test:integration` | Run integration tests (real dependencies) |
> | `npm run test:watch` | Run tests in watch mode |
> | `npm run test:ui` | Open Vitest UI |
> | `npm run coverage` | Generate test coverage report |
> | `npm run context:dump` | Dump AI context for debugging |
>
> ---
>
> ## Testing
>
> The project uses **Vitest** as the test runner with:
>
> - **Unit tests** — Dependencies mocked via MSW and Vitest mocks
> - - **Integration tests** — Uses `mongodb-memory-server` for an in-memory MongoDB instance and `supertest` for HTTP assertions
>  
>   - ```bash
>     # Run all unit tests
>     npm run test:unit
>
>     # Run all integration tests
>     npm run test:integration
>
>     # Generate coverage report
>     npm run coverage
>     ```
>
> Tests are located in the `tests/` directory at the project root.
>
> ---
>
> ## API Documentation
>
> The API is fully documented with **Swagger / OpenAPI 3.0**.
>
> Access the interactive docs at: [https://coursemate-server-3a4x.onrender.com/api-docs](https://coursemate-server-3a4x.onrender.com/api-docs)
>
> When running locally, visit: `http://localhost:5000/api-docs`
> > Documentation: [Google Drive Doc](https://drive.google.com/file/d/1fdbXbw_ahQhEbUQrTpUfUb1vS_rLrTSG/view?usp=sharing)
>
> ---
>
> ## Project Structure
>
> ```
> CourseMate-Server/
> ├── src/
> │   ├── config/                  # DB connection, env config
> │   ├── features/
> │   │   ├── academic-plan/
> │   │   ├── academic-rule/
> │   │   ├── academic-warning/
> │   │   ├── ai/
> │   │   ├── ai-recommendation/
> │   │   ├── analytics/
> │   │   ├── auth/
> │   │   ├── course/
> │   │   ├── course-section/
> │   │   ├── department/
> │   │   ├── important-dates/
> │   │   ├── knowledge-base/
> │   │   ├── notification/
> │   │   ├── schedule/
> │   │   └── user/
> │   ├── shared/
> │   │   ├── middlewares/
> │   │   ├── types/
> │   │   └── utils/
> │   └── seed.ts
> ├── tests/
> ├── app.ts                       # Express app setup
> ├── index.ts                     # Server entry point
> ├── swagger.ts                   # Swagger configuration
> ├── tsconfig.json
> ├── vitest.config.ts
> └── package.json
> ```
>
> ---
>
> ## Contributors
>
> | Name | GitHub |
> |------|--------|
> | Mais Arafeh | [@Mais-A-A](https://github.com/Mais-A-A) |
> | Hasan Al-Saafin | [@HasanAlsaafen](https://github.com/HasanAlsaafen) |
> | Hasan Alsaafin | [@Hasan2005-CS](https://github.com/Hasan2005-CS) |
