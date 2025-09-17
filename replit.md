# Overview

This is an e-commerce web application called "DTF Drop" built with Next.js that specializes in drop shoulder clothing. The platform allows sellers to list products and buyers to browse and purchase items. The application features user authentication, product management, automated user synchronization using event-driven architecture, dynamic scrolling indicators, professional mobile enhancements, and a comprehensive customization system for custom product designs.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 15 with App Router architecture
- **Styling**: Tailwind CSS for utility-first styling with custom scrollbar and input styling
- **State Management**: React Context API (AppContextProvider) for global state management
- **UI Components**: Custom components with React Hot Toast for notifications, dynamic scroll indicators, and professional mobile enhancements
- **Font**: Outfit font from Google Fonts for consistent typography
- **Visual Enhancements**: Dynamic scrolling indicator with gradient effects, professional animations (fade-in-up, float-up, slide-in-left, shimmer), and mobile-first responsive design

## Backend Architecture
- **API Routes**: Next.js API routes following RESTful conventions
- **Authentication**: Clerk for user authentication and authorization with role-based access control
- **Authorization**: Custom seller authentication middleware to restrict product management to sellers only
- **Database**: MongoDB with Mongoose ODM for data modeling and queries
- **Event Processing**: Inngest for handling background tasks and user synchronization events

## Data Storage
- **Primary Database**: MongoDB with connection pooling and caching for performance
- **Schema Design**: 
  - User model with cart items, contact info, and join date tracking
  - Product model with comprehensive fields including ratings, reviews, categories, gender targeting, design types, colors, and sizes
  - CustomizationTemplate model for managing custom product categories, colors, sizes, mockup images, and pricing
  - CustomOrder model for processing custom design orders with image positioning, sizing, and WhatsApp integration
- **File Storage**: Cloudinary for image upload and management with automatic optimization, secure deletion functionality, and custom design file handling

## Authentication & Authorization
- **User Authentication**: Clerk handles sign-up, sign-in, and session management
- **Role-Based Access**: Users can have 'seller' role stored in Clerk's public metadata
- **Protected Routes**: Middleware protection for all routes except static files and Next.js internals
- **API Security**: Authentication checks on all API endpoints with user context extraction

## Event-Driven Architecture
- **Background Processing**: Inngest functions handle user lifecycle events (create, update, delete)
- **User Synchronization**: Automatic sync between Clerk user events and MongoDB user records
- **Webhook Integration**: Real-time processing of authentication events for data consistency

## Customization System
- **Product Customization**: Comprehensive system allowing users to select product categories (drop shoulder, T-shirt, polo), colors, and sizes
- **Design Tools**: Professional drag-and-drop interface for uploading and positioning up to 4 design images (front, back, sleeve, pocket)
- **Image Management**: Cloudinary integration for secure image uploads with positioning and resizing controls
- **Pricing Logic**: Base price includes front and back designs; sleeve and pocket designs cost BDT 30 extra each
- **Order Processing**: Custom order creation with WhatsApp integration (+8801344823831) for high-resolution file sharing
- **Admin Management**: Complete admin panel for sellers to manage customization templates, mockup images, colors, sizes, and pricing

# External Dependencies

## Authentication Service
- **Clerk**: Complete authentication solution providing user management, session handling, and webhook events for user lifecycle management

## Database & Storage
- **MongoDB**: Primary database for user and product data storage
- **Cloudinary**: Cloud-based image and video management service for product image uploads, transformations, and delivery

## Background Processing
- **Inngest**: Event-driven platform for handling background jobs, user synchronization, and webhook processing with built-in retry logic and monitoring

## Development Tools
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **ESLint**: Code linting with Next.js specific configurations
- **React Hot Toast**: Toast notification library for user feedback

## HTTP Client
- **Axios**: Promise-based HTTP client for API requests and external service communication