import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.roles?.some(r => r.toUpperCase() === "ADMIN");
    const hasViewAdminPermission = session?.user?.permissions?.includes("VIEW_ADMIN");

    if (!session || (!isAdmin && !hasViewAdminPermission)) {
        redirect("/dashboard");
    }

    const hasPermission = (perm: string) => {
        return isAdmin || session?.user?.permissions?.includes(perm);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
            <aside className="w-64 bg-gray-800 p-6 flex flex-col">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Administration
                    </h1>
                </div>
                <nav className="flex-1 space-y-2">
                    <Link
                        href="/dashboard"
                        className="block p-2 hover:bg-gray-700 rounded text-gray-400"
                    >
                        &larr; Retour au site
                    </Link>

                    <div className="pt-4 pb-2 text-xs font-bold text-gray-500 uppercase">Gestion</div>

                    {hasPermission("MANAGE_USERS") && (
                        <Link
                            href="/admin/users"
                            className="block p-2 hover:bg-gray-700 rounded"
                        >
                            Musiciens
                        </Link>
                    )}

                    {hasPermission("MANAGE_ROLES") && (
                        <Link
                            href="/admin/roles"
                            className="block p-2 hover:bg-gray-700 rounded text-purple-300"
                        >
                            Rôles & Permissions
                        </Link>
                    )}

                    <div className="pt-4 pb-2 text-xs font-bold text-gray-500 uppercase">Activités</div>

                    {(hasPermission("MANAGE_EVENTS") || hasPermission("VIEW_ATTENDANCE")) && (
                        <>
                            <Link
                                href="/admin/attendance"
                                className="block p-3 rounded hover:bg-gray-700 transition-colors"
                            >
                                Présences
                            </Link>
                            <Link
                                href="/admin/events"
                                className="block p-3 rounded hover:bg-gray-700 transition-colors"
                            >
                                Événements
                            </Link>
                        </>
                    )}

                    <div className="pt-4 pb-2 text-xs font-bold text-gray-500 uppercase">Demandes</div>

                    {hasPermission("MANAGE_USERS") && (
                        <Link
                            href="/admin/requests"
                            className="block p-3 rounded hover:bg-gray-700 transition-colors"
                        >
                            Demandes de profil
                        </Link>
                    )}
                </nav>
                <div className="mt-auto pt-6 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                        Connecté en tant que<br />
                        <span className="font-bold text-white">{session.user.name}</span>
                    </div>
                </div>
            </aside>
            <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
    );
}
