# Workout Tracker - AI Agent Instructions

## Architecture Overview

This is a React fitness tracking app built with Vite + TypeScript, using Supabase for backend services and shadcn/ui for components. The app follows a page-based architecture with a persistent sidebar layout and comprehensive auth system.

### Core Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Radix primitives + Tailwind CSS
- **Backend**: Supabase (auth, database, real-time)
- **State**: React Query for server state + React Context for auth
- **Routing**: React Router v6 with protected routes

## Development Workflow

### Getting Started
```bash
bun install     # Install dependencies (ALWAYS use bun, not npm)
bun run dev     # Start dev server (localhost:8080)
bun run build   # Production build
```

### Key Commands
- **ALWAYS use bun** - Project uses bun.lockb, npm is not available/configured
- Dev server runs on port 8080 (configured in vite.config.ts)
- Authentication is currently bypassed in development (see App.tsx comment)

## Project Structure Patterns

### Component Organization
```
src/components/
├── ui/           # shadcn/ui base components (button, card, etc.)
├── layout/       # App shell components (AppSidebar, Header, etc.)
├── dashboard/    # Page-specific components (StatsCard, QuickActions)
└── ProtectedRoute.tsx  # Route guards
```

### Page Architecture
- **Pages**: Located in `src/pages/` - each represents a main route
- **Layout**: Persistent sidebar + main content area (see App.tsx routing structure)
- **Navigation**: Use `useNavigate()` from react-router-dom, paths defined in AppSidebar.tsx

### Authentication Flow
- **Context**: `AuthContext.tsx` provides auth state and methods
- **Supabase**: Pre-configured client in `src/integrations/supabase/client.ts`
- **Dev Mode**: Authentication bypassed with mock user in App.tsx and AppSidebar.tsx
- **Protected Routes**: Wrap with `<ProtectedRoute>` component

## Styling System

### Theme & Colors
- **Fitness-focused palette**: Energetic reds, corals, and gradients
- **CSS Variables**: Defined in `src/index.css` with fitness-specific colors
- **Gradients**: Use predefined gradients like `bg-gradient-primary`, `bg-gradient-hero`
- **Responsive**: Mobile-first with `md:` breakpoints

### Component Patterns
- **Cards**: Use shadcn Card with gradient variants (see StatsCard.tsx)
- **Icons**: Lucide React icons throughout
- **Buttons**: Extend base Button with custom variants (hero, primary, etc.)
- **Sidebar**: Uses shadcn sidebar components with collapse/expand behavior

### Key Classes
```css
bg-gradient-primary   # Red gradient for primary actions
bg-gradient-hero      # Text gradient for headings
shadow-glow           # Special glow effect for primary cards
transition-smooth     # Consistent transitions
```

## Data & Integration Patterns

### Supabase Setup
- **Client**: Pre-configured with auth persistence in localStorage
- **Types**: Generated types in `src/integrations/supabase/types.ts` (currently empty schema)
- **Real-time**: Supabase client configured for real-time subscriptions

### State Management
- **Server State**: Use React Query (`@tanstack/react-query`)
- **Auth State**: React Context pattern in `AuthContext.tsx`
- **Local State**: Standard React hooks (useState, useEffect)

### API Patterns
```typescript
// Supabase client usage
import { supabase } from "@/integrations/supabase/client";

// Auth methods available in context
const { signIn, signOut, user, loading } = useAuth();
```

## Code Conventions

### File Naming
- **Components**: PascalCase.tsx (`StatsCard.tsx`)
- **Pages**: PascalCase.tsx in `src/pages/`
- **Hooks**: kebab-case with 'use-' prefix (`use-mobile.tsx`)
- **Utils**: kebab-case.ts (`utils.ts`)

### Import Patterns
```typescript
// Use @ alias for all src imports
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
```

### Component Structure
- Export default components
- Use TypeScript interfaces for props
- Include Lucide icons as props when needed
- Follow shadcn/ui composition patterns

## Navigation & Routes

### Route Structure (from App.tsx)
```typescript
// Public routes
/login, /register

// Main app routes (nested under sidebar layout)
/ (dashboard), /schedule, /exercises, /goals, /progress
/workout/:id, /workout/new, /workout/quick
/goals/new, /settings
```

### Navigation Helpers
- Use `useNavigate()` for programmatic navigation
- Check `useLocation()` for active path styling
- Sidebar navigation items defined in `AppSidebar.tsx`

## Development Notes

- **Hot Reload**: Vite with SWC for fast refresh
- **TypeScript**: Strict mode enabled, prefer explicit typing
- **Linting**: ESLint configured for React + TypeScript
- **Build Tool**: Lovable platform integration (see README.md)
- **Database**: Schema currently empty - will need table definitions for full functionality

When adding new features, follow the established patterns for components, routing, and styling. Always use the @ import alias and maintain the fitness theme consistency.
