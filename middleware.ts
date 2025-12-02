import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isChangePasswordPage = req.nextUrl.pathname === "/change-password";
        const isLoginPage = req.nextUrl.pathname === "/login";

        if (isAuth) {
            if (req.nextUrl.pathname.startsWith("/admin") && token.role !== "ADMIN") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
            if (isAuth) {
                if (req.nextUrl.pathname.startsWith("/admin") && token.role !== "ADMIN") {
                    return NextResponse.redirect(new URL("/dashboard", req.url));
                }
                if (token.mustChangePassword && !isChangePasswordPage) {
                    return NextResponse.redirect(new URL("/change-password", req.url));
                }
                if (!token.mustChangePassword && isChangePasswordPage) {
                    return NextResponse.redirect(new URL("/dashboard", req.url));
                }
            }
            if (token.mustChangePassword && !isChangePasswordPage) {
                return NextResponse.redirect(new URL("/change-password", req.url));
            }
            if (!token.mustChangePassword && isChangePasswordPage) {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/change-password"],
};
