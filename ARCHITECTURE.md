# AIFM Baring - Application Architecture

## Overview

This application follows a structured architecture with separated authenticated and unauthenticated sections. The authentication flow is managed through guards and services to ensure secure access to protected routes.

## Folder Structure

```
src/app/
├── authenticated/              # Protected routes and components
│   └── layout/                 # Layout wrapper for authenticated pages
│       ├── layout.component.ts
│       └── layout.module.ts
│
├── unauthenticated/            # Public routes and components
│   └── user/                   # User authentication module
│       ├── login/              # Login component
│       │   ├── login.component.ts
│       │   ├── login.component.html
│       │   └── login.component.scss
│       └── user.module.ts
│
├── core/                       # Core services and guards
│   ├── guards/
│   │   └── auth.guard.ts       # Authentication guard
│   └── services/
│       └── auth.service.ts     # Authentication service
│
├── shared/                     # Shared components
│   └── components/
│       ├── navbar/
│       ├── footer/
│       ├── fund-selector/
│       └── newsletter/
│
├── web-dashboard/              # Dashboard module (authenticated)
├── web-portfolio/              # Portfolio module (authenticated)
├── web-documents/              # Documents module (authenticated)
│
├── app.routes.ts               # Application routing
├── app.config.ts               # Application configuration
└── app.ts                      # Root component
```

## Authentication Flow

### 1. Unauthenticated Access
- Users start at `/user/login`
- Login component displays the authentication form
- Credentials are validated via `AuthService`
- On success, user is redirected to `/dashboard`

### 2. Authenticated Access
- All main routes (`/dashboard`, `/portfolio`, `/documents`) are protected by `AuthGuard`
- `AuthGuard` checks for valid authentication token
- If not authenticated, user is redirected to `/user/login`
- Authenticated pages are wrapped in `AuthenticatedLayoutComponent` which includes:
  - Navbar with logout functionality
  - Fund selector
  - Main content area
  - Newsletter section
  - Footer

### 3. Logout Flow
- User clicks logout in navbar dropdown
- `AuthService.logout()` is called
- Authentication token and user data are cleared
- User is redirected to `/user/login`

## Key Components

### AuthService (`core/services/auth.service.ts`)
Manages authentication state and user session:
- `login(credentials)` - Authenticates user and stores token
- `logout()` - Clears session and redirects to login
- `isAuthenticated()` - Checks if user is logged in
- `getToken()` - Retrieves auth token
- `getUserEmail()` - Gets logged in user's email
- `getUserRole()` - Gets user's role

### AuthGuard (`core/guards/auth.guard.ts`)
Protects routes from unauthorized access:
- Implements `canActivate` interface
- Checks authentication status
- Redirects to login if not authenticated

### Login Component (`unauthenticated/user/login`)
Handles user authentication:
- Reactive form with email, password, and role fields
- Form validation
- Loading and error states
- Matches Figma design exactly

### Authenticated Layout (`authenticated/layout/layout.component.ts`)
Wrapper component for authenticated pages:
- Includes navbar, fund-selector, footer, newsletter
- Provides consistent layout across protected routes

## Routing Structure

```typescript
routes: [
  {
    path: 'user',
    loadChildren: () => import('./unauthenticated/user/user.module')
    // Login page (unauthenticated)
  },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', ... },  // Protected route
      { path: 'portfolio', ... },  // Protected route
      { path: 'documents', ... },  // Protected route
    ]
  },
  { path: '**', redirectTo: 'user/login' }
]
```

## Adding New Authenticated Routes

To add a new authenticated route:

1. Create your module/component in the appropriate location
2. Add the route as a child of the authenticated layout:

```typescript
{
  path: 'new-route',
  loadChildren: () => import('./path/to/module').then(m => m.NewModule)
}
```

The `AuthGuard` will automatically protect it.

## Adding New Unauthenticated Routes

To add a new unauthenticated route:

1. Create your component in `unauthenticated/` folder
2. Add route at root level (not under authenticated layout):

```typescript
{
  path: 'public-route',
  loadChildren: () => import('./unauthenticated/module').then(m => m.Module)
}
```

## Environment & Configuration

- Authentication tokens are stored in `localStorage`
- Token key: `auth_token`
- User email key: `user_email`
- User role key: `user_role`

## Future Enhancements

- [ ] Implement real API authentication
- [ ] Add token refresh mechanism
- [ ] Implement role-based access control
- [ ] Add password reset functionality
- [ ] Add remember me functionality
- [ ] Implement session timeout
- [ ] Add multi-factor authentication
