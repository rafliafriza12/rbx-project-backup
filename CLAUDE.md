# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` or `pnpm dev` - Starts Next.js development server on http://localhost:3000
- **Build**: `npm run build` or `pnpm build` - Creates production build
- **Start production**: `npm run start` or `pnpm start` - Runs production build
- **Lint**: `npm run lint` or `pnpm lint` - Runs ESLint to check code quality

## Project Architecture

This is a **Next.js 15** application for RBXNET, a Robux marketplace platform targeting Indonesian users. The project uses the App Router architecture with TypeScript and MongoDB.

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Tailwind CSS with custom animations
- **Authentication**: Custom JWT-based auth + Google OAuth via `@react-oauth/google`
- **Payment**: Midtrans integration for Indonesian payments
- **UI Components**: React with Framer Motion for animations
- **State Management**: React Context (AuthContext for authentication)

### Key Architecture Patterns

**Authentication Flow**:
- AuthContext (`contexts/AuthContext.tsx`) manages user state and authentication
- Supports regular login, admin login, Google OAuth, and registration
- User roles: `user` | `admin` with member tier system (Bronze, Silver, Gold)
- JWT tokens stored in httpOnly cookies
- Middleware currently bypassed (`middleware.ts` line 6) - authentication handled client-side

**API Structure**:
- Full-stack API routes in `app/api/` covering:
  - Authentication (`/auth/*`)
  - User management (`/user/*`)
  - Products and gamepasses (`/products/*`, `/gamepass/*`)
  - Transactions and orders (`/transactions/*`, `/orders/*`)
  - Payment processing (`/webhooks/*`)
  - Admin features (`/admin/*`)

**Database Models** (`models/`):
- User with member roles and spending tracking
- Products, Gamepasses, Transactions with status tracking
- Settings for site configuration
- Reviews and leaderboard system
- Stock account management for Robux delivery

**Component Structure**:
- Route-based pages in `app/` directory
- Reusable UI components in `components/`
- Separate admin interface components
- Public/private routing with auth protection

### Key Features
- **Multi-tier membership system** with discounts based on spending
- **Gamepass marketplace** with Roblox integration
- **Order tracking** with real-time status updates
- **Indonesian payment integration** via Midtrans
- **Admin dashboard** for managing products, users, and transactions
- **Review and rating system**
- **Email notifications** with invoice generation
- **Cloudinary integration** for image management

### Environment Setup
- Copy `.env.example` to `.env.local` and configure:
  - MongoDB connection
  - JWT secrets
  - Google OAuth credentials
  - Midtrans payment keys
  - Cloudinary settings
  - Email service configuration

### Important Notes
- **Build configuration**: ESLint and TypeScript errors ignored during builds (see `next.config.ts`)
- **Font system**: Uses Poppins and Geist fonts with CSS variables
- **Internationalization**: Primarily Indonesian language with some English
- **Payment flow**: Integrates with Midtrans for Indonesian payment methods
- **File uploads**: Uses Cloudinary for image storage and optimization