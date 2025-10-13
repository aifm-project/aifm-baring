# Authentication Quick Start Guide

## Overview

The Baring Investor Portal now has a complete authentication system with a login page that matches the Figma design exactly.

## Getting Started

### 1. Access the Login Page

Navigate to: `http://localhost:4201/user/login`

The login page features:
- Left side: Background image with "BARING PRIVATE EQUITY PARTNERS" branding
- Right side: Login form with Email, Password, and User Role fields

### 2. Login Credentials

Currently using mock authentication. Enter any values:
- **Email**: Any valid email format (e.g., investor@example.com)
- **Password**: Any password
- **User Role**: Select from dropdown (Investor, Admin, or Manager)

### 3. After Login

Upon successful login:
- You'll be redirected to `/dashboard`
- The navbar will show your email in the user menu
- You can logout by clicking your profile avatar and selecting "Logout"

## Architecture

### Unauthenticated Routes
- `/user/login` - Login page (public access)

### Authenticated Routes (Protected)
All routes below require authentication:
- `/dashboard` - Main dashboard
- `/portfolio` - Portfolio view
- `/documents` - Documents view

### Automatic Redirects
- Accessing protected routes without login → Redirects to `/user/login`
- Accessing login when already logged in → Redirects to `/dashboard`
- Invalid routes → Redirects to `/user/login`

## Key Features

### Login Component
- ✅ Pixel-perfect Figma design implementation
- ✅ Responsive layout (desktop, tablet, mobile)
- ✅ Form validation (email format, required fields)
- ✅ Loading states during authentication
- ✅ Error message display
- ✅ "Forgot Password?" link (placeholder)
- ✅ Terms & Conditions and Privacy Policy links

### Authentication Service
- ✅ Login functionality with credentials
- ✅ Logout functionality
- ✅ Token management (localStorage)
- ✅ User session tracking
- ✅ Observable authentication state

### Auth Guard
- ✅ Route protection
- ✅ Automatic redirection
- ✅ Token validation

### Navbar Integration
- ✅ User email display
- ✅ Dropdown menu
- ✅ Logout functionality
- ✅ Responsive design

## Folder Structure

```
src/app/
├── unauthenticated/           # Public pages
│   └── user/
│       ├── login/             # Login component (Figma design)
│       └── user.module.ts
│
├── authenticated/             # Protected pages
│   └── layout/                # Wrapper with navbar, footer, etc.
│
├── core/
│   ├── guards/
│   │   └── auth.guard.ts      # Route protection
│   └── services/
│       └── auth.service.ts    # Auth logic
│
└── shared/                    # Shared components
    └── components/
        └── navbar/            # With logout functionality
```

## Implementation Details

### Login Form Validation

```typescript
// Email validation
email: ['', [Validators.required, Validators.email]]

// Password validation
password: ['', [Validators.required]]

// User role validation
userRole: ['', [Validators.required]]
```

### Session Storage

The authentication system stores:
- `auth_token` - Authentication token
- `user_email` - User's email address
- `user_role` - User's selected role

### Styling

The login component uses:
- **Victor Serif Trial** - Headings and branding
- **Instrument Sans** - Body text and form labels
- Custom color palette matching Figma design
- Fully responsive breakpoints (1024px, 768px)

## Next Steps for Development

### 1. Connect to Real API

Replace mock authentication in `auth.service.ts`:

```typescript
login(credentials: LoginCredentials): Observable<boolean> {
  return this.http.post<AuthResponse>('/api/auth/login', credentials)
    .pipe(
      map(response => {
        localStorage.setItem('auth_token', response.token);
        // ... handle response
        return true;
      })
    );
}
```

### 2. Implement Password Reset

Create forgot password component:
- Add route: `/user/forgot-password`
- Create component in `unauthenticated/user/forgot-password`
- Link from login page

### 3. Add Role-Based Access Control

Create role guard:
```typescript
// core/guards/role.guard.ts
canActivate(route: ActivatedRouteSnapshot): boolean {
  const requiredRole = route.data['role'];
  const userRole = this.authService.getUserRole();
  return userRole === requiredRole;
}
```

### 4. Implement Token Refresh

Add token refresh logic:
```typescript
// In auth.service.ts
refreshToken(): Observable<string> {
  return this.http.post<{token: string}>('/api/auth/refresh', {
    refresh_token: this.getRefreshToken()
  }).pipe(map(response => response.token));
}
```

### 5. Add Session Timeout

Implement auto-logout on inactivity:
```typescript
// Create idle.service.ts
// Track user activity
// Auto-logout after X minutes of inactivity
```

## Testing

### Manual Testing Checklist

- [ ] Navigate to `/user/login` - Login page displays
- [ ] Submit empty form - Validation errors show
- [ ] Submit invalid email - Email validation error shows
- [ ] Submit valid credentials - Redirects to dashboard
- [ ] Access `/dashboard` without login - Redirects to login
- [ ] Click logout - Redirects to login and clears session
- [ ] Login and refresh page - Session persists
- [ ] Responsive design works on mobile, tablet, desktop

### Test User Flows

1. **First-time visitor**
   - Lands on login page
   - Enters credentials
   - Accesses dashboard

2. **Returning user**
   - Already logged in (token in localStorage)
   - Directly accesses dashboard
   - Session persists

3. **Logout flow**
   - Clicks profile avatar
   - Selects logout
   - Redirected to login
   - Cannot access protected routes

## Troubleshooting

### Issue: Redirecting to login after successful login
**Solution**: Check if token is being stored correctly in localStorage

### Issue: Protected routes accessible without login
**Solution**: Verify `AuthGuard` is applied in `app.routes.ts`

### Issue: Logout not working
**Solution**: Check if `AuthService.logout()` is clearing localStorage

### Issue: Layout not showing on authenticated pages
**Solution**: Verify `AuthenticatedLayoutComponent` is imported in routes

## Support

For questions or issues:
1. Check `ARCHITECTURE.md` for detailed architecture
2. Review code comments in service and guard files
3. Ensure all dependencies are installed: `npm install`
4. Restart dev server: `npm start`
