# Layer3 Quest Platform

## Overview

This is a Web3 quest discovery platform that replicates the Layer3 experience (app.layer3.xyz/discover). The application features a gamified quest system where users can explore and participate in blockchain-based quests, campaigns, and earning opportunities. The platform emphasizes Web3 aesthetics with dark mode theming, card-based layouts, and ecosystem-specific content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **React 18** with TypeScript for type safety and modern development patterns
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for lightweight client-side routing instead of React Router

### UI Framework & Design System
- **shadcn/ui** component library built on Radix UI primitives for accessibility
- **Tailwind CSS** for utility-first styling with custom design tokens
- **CVA (Class Variance Authority)** for component variant management
- Dark mode theme with Layer3-inspired color palette (dark navy backgrounds, electric blue accents)
- Custom CSS variables for theme consistency and hover effects

### State Management
- **TanStack Query (React Query)** for server state management and caching
- Local component state with React hooks for UI interactions
- No global state management library - keeping state close to components

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations and schema management
- **PostgreSQL** as the primary database (configured for Neon serverless)
- RESTful API design with `/api` prefix for all endpoints
- Session-based storage interface with both memory and database implementations

### Database Schema
- User management system with basic authentication fields
- Extensible schema design using Drizzle for easy migrations
- PostgreSQL-specific features leveraged for UUID generation

### Development & Build Process
- **ESBuild** for server-side bundling in production
- **Hot Module Replacement** in development via Vite
- TypeScript path aliases for clean imports (`@/`, `@shared/`, `@assets/`)
- Shared types between client and server in `/shared` directory

### Asset Management
- Static assets served from `/attached_assets` directory
- Generated images for quest cards, logos, and ecosystem badges
- Optimized asset loading with proper CORS and caching headers

### Component Architecture
- Modular component design with clear separation of concerns
- Example components provided for development reference
- Reusable UI components following atomic design principles
- Card-based layouts for quests, campaigns, and streaks
- Responsive grid systems for different content types

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless** - Serverless PostgreSQL database connection
- **@radix-ui/** - Comprehensive set of unstyled, accessible UI primitives
- **@tanstack/react-query** - Server state management and data fetching
- **drizzle-orm** - Type-safe ORM with PostgreSQL dialect

### UI & Styling
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant management
- **clsx** & **tailwind-merge** - Conditional class name utilities
- **lucide-react** - Icon library for consistent iconography

### Development Tools
- **tsx** - TypeScript execution for development server
- **@replit/vite-plugin-runtime-error-modal** - Enhanced error reporting in Replit
- **@replit/vite-plugin-cartographer** - Development tooling for Replit environment

### Form & Validation
- **react-hook-form** - Form state management
- **@hookform/resolvers** - Form validation resolvers
- **zod** - Schema validation for forms and API data

### Additional Libraries
- **date-fns** - Date manipulation and formatting
- **embla-carousel-react** - Carousel component for content sections
- **cmdk** - Command palette interface components
- **connect-pg-simple** - PostgreSQL session store for Express