# EventMaster - Event Management Platform

## Overview

EventMaster is a full-stack event management and ticketing platform built with a modern React frontend and Express.js backend. The application allows users to discover, book, and manage events with integrated payment processing through Stripe. It features role-based access control with dedicated admin capabilities for event management and analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Replit Environment Migration & Payment System Update - August 12, 2025)

✅ **Replit Environment Migration** - Successfully migrated from Replit Agent to standard Replit environment
✅ **Payment System Simplification** - Removed Stripe payment processing per user request
✅ **Email-Only Confirmations** - Implemented automatic booking confirmation with Gmail notifications
✅ **Session Storage Migration** - Migrated from PostgreSQL session storage to memory-based sessions for Replit compatibility
✅ **Database Configuration** - Configured for in-memory data storage with MongoDB schema ready for future use
✅ **Authentication System** - Updated both Replit Auth and Auth0 configurations to use memory sessions
✅ **Environment Variables Setup** - All configuration moved to secure environment variables (email, session secrets)
✅ **Checkout Flow Update** - Modified checkout page to show instant confirmation instead of payment processing
✅ **Booking System** - Auto-confirms bookings with immediate Gmail notifications to attendees
✅ **Dependencies Update** - Installed MongoDB and Mongoose packages, removed unnecessary PostgreSQL dependencies
✅ **Server Setup** - Application running on port 5000 with all core functionality working
✅ **Dashboard Enhancements** - Added progress bars showing event capacity fill rates
✅ **Revenue & Analytics** - Fixed dashboard stats showing proper revenue ($522) and conversion rates (80%)
✅ **Admin Authentication** - Admin login working with proper session management
✅ **UI Improvements** - Enhanced dashboard with visual progress indicators for event capacity
✅ **User Menu** - Added dropdown menu with profile access and logout functionality
✅ **Progress Bars** - Implemented capacity fill visualization across dashboard and events table
✅ **Mobile Responsive Design** - Made landing page, events page, and admin dashboard responsive for mobile devices
✅ **Email Notifications** - Added proper booking confirmation and cancellation email templates with rich HTML styling
✅ **Booking Cancellation** - Implemented booking cancellation functionality with automatic email notifications
✅ **User Management System** - Created comprehensive users page with search, filtering, and statistics
✅ **Duplicate Events Cleanup** - Removed duplicate events from database, maintaining data integrity
✅ **MongoDB Migration Complete** - Successfully migrated from in-memory to persistent MongoDB storage (August 12, 2025)
✅ **Complete System Testing** - All features working: event display, user registration, booking system, Gmail notifications
✅ **Data Persistence Verified** - Users, events, and bookings saving permanently to MongoDB database
✅ **Replit Environment Migration (August 12, 2025)** - Successfully migrated EventMaster from Replit Agent to standard Replit environment
✅ **Dependencies Fixed** - Installed missing tsx dependency to resolve application startup issues
✅ **MongoDB Connection Setup** - Configured MongoDB URI environment variable for database connectivity
✅ **Routing Issues Fixed** - Fixed Sign In button navigation from landing page to login page
✅ **Authentication System Enhanced** - Updated user registration to handle database storage and password hashing
✅ **Data Mapping Fixed** - Resolved MongoDB field mapping issues to prevent undefined values in events and users
✅ **Booking System Critical Fixes** - Fixed booking ID handling (ObjectId vs numeric), checkout page redirects, and "booking not found" errors
✅ **Event Attendee Count Updates** - Fixed real-time ticket count updates when bookings are created or cancelled
✅ **Database Query Optimization** - Enhanced booking retrieval to support both MongoDB ObjectId and numeric ID formats
✅ **Deployment Ready** - Created complete deployment files (render.yaml, Dockerfile, build.sh, .dockerignore) for Render hosting
✅ **User Experience Improvements** - Enhanced checkout confirmation page with proper booking details display
✅ **Email System Working** - Booking confirmation emails sending successfully via Gmail integration
✅ **Session Management** - Memory-based sessions working properly with authentication flow

## User Preferences

Preferred communication style: Simple, everyday language.
Event focus: Technology events (AI, web development, mobile, cloud computing, cybersecurity, etc.)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: MongoDB with Mongoose ODM
- **Database Provider**: MongoDB Atlas with provided credentials
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: express-session with memory store
- **Payment Processing**: Stripe integration

### Database Schema (MongoDB)
- **Users**: Authentication and profile management with flexible document structure
- **Events**: Event details, scheduling, and capacity management
- **Bookings**: Ticket reservations and payment tracking
- **Notifications**: User notification system
- **ContactMessages**: Contact form submissions and inquiries

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Authorization**: Role-based access control (admin/user roles)
- **Security**: HTTPOnly cookies with secure flag in production

### Event Management
- **CRUD Operations**: Full event lifecycle management for admins
- **Filtering & Search**: Category-based filtering and text search
- **Capacity Management**: Max attendees tracking and availability checks
- **Status Management**: Draft, active, upcoming, completed event states

### Booking System
- **Ticket Reservation**: Multi-quantity booking with unique reference codes
- **Payment Integration**: Stripe payment intents for secure transactions
- **Status Tracking**: Pending, confirmed, cancelled booking states
- **Inventory Management**: Real-time attendee count updates

### Admin Dashboard
- **Analytics**: Dashboard with key metrics (events, attendees, revenue, conversion)
- **Event Management**: Create, edit, delete events with status controls
- **User Management**: View user profiles and booking history
- **Real-time Updates**: Live data with TanStack Query cache invalidation

## Data Flow

### User Journey
1. **Discovery**: Browse events on landing page or events listing
2. **Authentication**: Sign in via Replit Auth when booking
3. **Booking**: Select tickets and create booking with unique reference
4. **Payment**: Stripe checkout flow with payment intent creation
5. **Confirmation**: Booking status updates and email confirmation

### Admin Workflow
1. **Authentication**: Admin users access dedicated dashboard
2. **Event Creation**: Form-based event creation with validation
3. **Management**: Real-time event updates and status changes
4. **Analytics**: Dashboard metrics with automatic data refresh

### Database Operations
- **Connection Pooling**: Neon serverless with connection pooling
- **Query Optimization**: Drizzle ORM with typed queries
- **Data Validation**: Zod schemas shared between client and server
- **Migration Management**: Drizzle migrations with schema versioning

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **@stripe/stripe-js**: Payment processing integration

### Development Tools
- **typescript**: Static type checking
- **tailwindcss**: Utility-first CSS framework
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for development

### Authentication
- **passport**: Authentication middleware
- **openid-client**: OpenID Connect implementation
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild compiles TypeScript server to `dist/index.js`
- **Assets**: Static files served from build directory in production

### Environment Configuration
- **Development**: Hot reload with Vite dev server proxy
- **Production**: Express serves static files with API routes
- **Database**: Environment-based DATABASE_URL configuration
- **Secrets**: Environment variables for Stripe keys and session secrets

### Scalability Considerations
- **Database**: Serverless PostgreSQL with automatic scaling
- **Sessions**: Database-backed sessions for horizontal scaling
- **Static Assets**: Vite optimization for efficient asset delivery
- **API Design**: RESTful endpoints with consistent error handling

The application uses a monorepo structure with shared TypeScript types and schemas between client and server, ensuring type safety across the full stack. The architecture prioritizes developer experience with hot reload, type safety, and modern tooling while maintaining production-ready performance and security.