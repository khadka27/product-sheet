import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/login")

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return null
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(from)}`, req.url))
    }

    // Check admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }

    // Check manager routes
    if (
      req.nextUrl.pathname.startsWith("/imports") ||
      req.nextUrl.pathname.startsWith("/brands") ||
      req.nextUrl.pathname.startsWith("/categories")
    ) {
      if (!["ADMIN", "MANAGER"].includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: () => true,
    },
  },
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
