"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Role {
    id: string;
    name: string;
    permissions: string[];
    createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
    "MANAGE_USERS",
    "MANAGE_ROLES",
    "MANAGE_EVENTS",
    "VIEW_ADMIN",
    "VIEW_ATTENDANCE",
];

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch("/api/roles");
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
            }
        } catch (error) {
            console.error("Failed to fetch roles", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (role: Role) => {
        setEditingId(role.id);
        setName(role.name);
        setPermissions(role.permissions);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) return;
        try {
            const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchRoles();
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to delete role", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/roles/${editingId}` : "/api/roles";
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, permissions }),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setName("");
                setPermissions([]);
                fetchRoles();
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to save role", error);
        }
    };

    const togglePermission = (perm: string) => {
        if (permissions.includes(perm)) {
            setPermissions(permissions.filter((p) => p !== perm));
        } else {
            setPermissions([...permissions, perm]);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Gestion des Rôles</h2>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setName("");
                        setPermissions([]);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold transition-colors"
                >
                    {showForm ? "Annuler" : "Créer un Rôle"}
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4">{editingId ? "Modifier le rôle" : "Créer un nouveau rôle"}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nom du Rôle</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Permissions</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {AVAILABLE_PERMISSIONS.map((perm) => (
                                    <label key={perm} className="flex items-center space-x-2 bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={permissions.includes(perm)}
                                            onChange={() => togglePermission(perm)}
                                            className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500 border-gray-500 bg-gray-600"
                                        />
                                        <span className="text-sm">{perm}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold transition-colors"
                        >
                            {editingId ? "Enregistrer" : "Créer"}
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Nom</th>
                            <th className="p-4">Permissions</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400">
                                    Chargement...
                                </td>
                            </tr>
                        ) : roles.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400">
                                    Aucun rôle trouvé.
                                </td>
                            </tr>
                        ) : (
                            roles.map((role) => (
                                <tr key={role.id} className="border-b border-gray-700 hover:bg-gray-750">
                                    <td className="p-4 font-bold">{role.name}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.map((p) => (
                                                <span key={p} className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 border border-gray-600">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 flex items-center gap-3">
                                        <button
                                            onClick={() => handleEdit(role)}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
