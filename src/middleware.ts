import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/auth/signin",
  "/api/auth",
  "/api/gallery",
  "/features.html",
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublic) return NextResponse.next();

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  const role = req.auth?.user?.role;
  if (role === "student" && pathname.startsWith("/teacher")) {
    return NextResponse.redirect(new URL("/student", nextUrl));
  }
  if (role === "teacher" && pathname.startsWith("/student")) {
    return NextResponse.redirect(new URL("/teacher", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg)).*)"],
};
