"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Role {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string; // Deprecated
    roles: Role[];
    instrument?: string;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [instrument, setInstrument] = useState("");

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await fetch("/api/roles");
            if (res.ok) {
                const data = await res.json();
                setAvailableRoles(data);
            }
        } catch (error) {
            console.error("Failed to fetch roles", error);
        }
    };

    const handleEdit = (user: User) => {
        setEditingId(user.id);
        setName(user.name);
        setEmail(user.email);
        setSelectedRoleIds(user.roles.map((r) => r.id));
        setInstrument(user.instrument || "");
        setPassword(""); // Don't fill password
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchUsers();
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/users/${editingId}` : "/api/users";
            const method = editingId ? "PATCH" : "POST";

            const body: any = {
                name,
                email,
                roles: selectedRoleIds,
                instrument,
            };
            if (password) body.password = password;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setName("");
                setEmail("");
                setPassword("");
                setInstrument("");
                setSelectedRoleIds([]);
                fetchUsers();
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to save user", error);
        }
    };

    const toggleRole = (roleId: string) => {
        if (selectedRoleIds.includes(roleId)) {
            setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId));
        } else {
            setSelectedRoleIds([...selectedRoleIds, roleId]);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Gestion des Musiciens</h2>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setName("");
                        setEmail("");
                        setPassword("");
                        setInstrument("");
                        setSelectedRoleIds([]);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold transition-colors"
                >
                    {showForm ? "Annuler" : "Ajouter un Musicien"}
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4">{editingId ? "Modifier le membre" : "Ajouter un nouveau membre"}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nom</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {editingId ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe initial"}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    required={!editingId}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Instrument</label>
                                <input
                                    type="text"
                                    value={instrument}
                                    onChange={(e) => setInstrument(e.target.value)}
                                    placeholder="Ex: Guitare, Piano, Chant..."
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Rôles</label>
                            <div className="flex flex-wrap gap-2">
                                {availableRoles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => toggleRole(role.id)}
                                        className={`px-3 py-1 rounded text-sm font-bold border transition-colors ${selectedRoleIds.includes(role.id)
                                                ? "bg-purple-600 border-purple-500 text-white"
                                                : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                            }`}
                                    >
                                        {role.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold transition-colors"
                        >
                            {editingId ? "Enregistrer les modifications" : "Créer le compte"}
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                {/* Desktop Table */}
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Nom</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Instrument</th>
                            <th className="p-4">Rôles</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    Chargement...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    Aucun utilisateur trouvé.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                                    <td className="p-4 font-medium">{user.name}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4 text-gray-400">{user.instrument || "-"}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles && user.roles.length > 0 ? (
                                                user.roles.map((r) => (
                                                    <span
                                                        key={r.id}
                                                        className="px-2 py-1 rounded text-xs font-bold bg-blue-900 text-blue-200"
                                                    >
                                                        {r.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-500 text-xs">Aucun rôle</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 flex items-center gap-3">
                                        <button
                                            onClick={() => router.push(`/admin/users/${user.id}`)}
                                            className="text-green-400 hover:text-green-300 font-bold text-sm"
                                            title="Voir l'historique"
                                        >
                                            📜 Historique
                                        </button>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
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

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                    {loading ? (
                        <div className="text-center text-gray-400">Chargement...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-gray-400">Aucun utilisateur trouvé.</div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-white text-lg">{user.name}</div>
                                        <div className="text-gray-400 text-sm">{user.email}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {user.roles && user.roles.length > 0 ? (
                                        user.roles.map((r) => (
                                            <span
                                                key={r.id}
                                                className="px-2 py-1 rounded text-xs font-bold bg-blue-900 text-blue-200"
                                            >
                                                {r.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-xs">Aucun rôle</span>
                                    )}
                                </div>

                                <div className="text-sm text-gray-300 mb-3">
                                    🎸 {user.instrument || "Aucun instrument"}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-600">
                                    <button
                                        onClick={() => router.push(`/admin/users/${user.id}`)}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-green-400 py-2 rounded text-sm font-bold"
                                    >
                                        📜 Historique
                                    </button>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-blue-400 py-2 rounded text-sm font-bold"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-red-400 py-2 rounded text-sm font-bold"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
