import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: string;
            roles: string[];
            permissions: string[];
            mustChangePassword: boolean;
        }
    }

    interface User {
        id: string;
        role: string;
        roles: string[];
        permissions: string[];
        mustChangePassword: boolean;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { roles: true },
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                // Collect all permissions from roles
                const roles = (user as any).roles || [];
                const permissions = Array.from(new Set(
                    roles.flatMap((r: any) => {
                        if (typeof r.permissions === 'string') {
                            try {
                                return JSON.parse(r.permissions);
                            } catch {
                                return [];
                            }
                        }
                        return r.permissions || [];
                    })
                )) as string[];

                console.log("Authorize - User:", user.email);
                console.log("Authorize - Roles:", roles.map((r: any) => r.name));
                console.log("Authorize - Permissions:", permissions);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role, // Keep for backward compatibility
                    roles: roles.map((r: any) => r.name.toUpperCase()), // Normalize to uppercase
                    permissions,
                    mustChangePassword: user.mustChangePassword,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                console.log("JWT Callback - User logged in:", user);
                token.role = user.role;
                token.roles = user.roles;
                token.permissions = user.permissions;
                token.mustChangePassword = user.mustChangePassword;
                token.id = user.id;
            } else {
                console.log("JWT Callback - Token check:", token);
            }
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback - Token:", token);
            if (session.user) {
                session.user.role = token.role as string;
                session.user.roles = token.roles as string[];
                session.user.permissions = token.permissions as string[];
                session.user.mustChangePassword = token.mustChangePassword as boolean;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};
