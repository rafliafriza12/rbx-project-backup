// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    return NextResponse.next(); // bypass semua
}

//return NextResponse.redirect(new URL('/login', request.url));

// export function middleware(request: NextRequest) {
//     const token = request.cookies.get('auth_token');
//     const userRole = request.cookies.get('user_role');
//     const pathname = request.nextUrl.pathname;

//     // Protected admin routes
//     if (pathname.startsWith('/admin')) {
//         if (!token) {
//             return NextResponse.redirect(new URL('/login', request.url));
//         }

//         // Check if user is admin or superadmin
//         if (userRole?.value !== 'admin' && userRole?.value !== 'superadmin') {
//             return NextResponse.redirect(new URL('/', request.url));
//         }
//     }

//     // If logged in admin tries to access login page, redirect to dashboard
//     if (pathname === '/login' && token) {
//         if (userRole?.value === 'admin' || userRole?.value === 'superadmin') {
//             return NextResponse.redirect(new URL('/admin/dashboard', request.url));
//         }
//     }

//     //return NextResponse.next();
//     return NextResponse.redirect(new URL('/login', request.url));
// }

// export const config = {
//     matcher: ['/admin/:path*', '/login']
// };