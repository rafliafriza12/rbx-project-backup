# Google OAuth Validation Fix

## Issues Fixed

1. **Duplicate Index Warning**:

   - Removed duplicate `googleId` index definition
   - Now using single index definition: `index: { unique: true, sparse: true }`

2. **Validation Errors**:
   - Updated User model to use custom validators instead of conditional required fields
   - Phone, countryCode, and password are now only required for non-Google OAuth users
   - Explicit empty string defaults are set in API route for Google OAuth users

## Changes Made

### 1. User Model (`models/User.ts`)

- Fixed duplicate index issue for `googleId` field
- Implemented custom validators for `phone`, `countryCode`, and `password`
- These fields skip validation when `googleId` exists
- Added proper TypeScript typing with `Schema<IUser>`

### 2. Google OAuth API Route (`app/api/auth/google/route.ts`)

- Explicitly set empty strings for `phone`, `countryCode`, and `password` for Google OAuth users
- This ensures the validation passes for Google accounts

## How It Works

When a user logs in with Google:

1. `googleId` field is set
2. Custom validators check if `googleId` exists
3. If `googleId` exists, validation for phone/countryCode/password returns `true`
4. User is created/updated successfully

For regular users (non-Google):

- All validation rules apply as before
- Phone, countryCode, and password are required

## Test the Fix

1. Try registering/logging in with Google OAuth
2. The validation errors should no longer occur
3. Check that regular registration still requires all fields
