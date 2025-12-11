"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    // Form state
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, date, location, description }),
            });

            if (res.ok) {
                setShowForm(false);
                setTitle("");
                setDate("");
                setLocation("");
                setDescription("");
                fetchEvents();
                router.refresh();
                fetchEvents();
                router.refresh();
                alert("Événement créé avec succès !");
            } else {
                const err = await res.text();
                alert(`Échec de la création de l'événement : ${err}`);
            }
        } catch (error) {
            console.error("Failed to create event", error);
            alert("Une erreur est survenue lors de la création de l'événement.");
        }
    };

    // Edit Modal State
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [editForm, setEditForm] = useState({
        title: "",
        date: "",
        location: "",
        description: "",
    });

    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setEditForm({
            title: event.title,
            date: new Date(event.date).toISOString().slice(0, 16),
            location: event.location || "",
            description: event.description || "",
        });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;

        try {
            const res = await fetch(`/api/events/${editingEvent.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                setEditingEvent(null);
                fetchEvents();
                router.refresh();
            } else {
                alert("Échec de la mise à jour de l'événement");
            }
        } catch (error) {
            console.error("Failed to update event", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.")) {
            return;
        }

        try {
            const res = await fetch(`/api/events/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                fetchEvents();
                router.refresh();
            } else {
                alert("Échec de la suppression de l'événement");
            }
        } catch (error) {
            console.error("Failed to delete event", error);
        }
    };

    return (
        <div>
            {/* Edit Modal */}
            {editingEvent && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-4 text-white">Modifier l'événement</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Titre</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Date et Heure</label>
                                <input
                                    type="datetime-local"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Lieu</label>
                                <input
                                    type="text"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white h-24"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingEvent(null)}
                                    className="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Gestion des Événements</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold transition-colors"
                >
                    {showForm ? "Annuler" : "Ajouter un Événement"}
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4">Créer un nouvel événement</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Titre</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date et Heure</label>
                                <input
                                    type="datetime-local"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Lieu</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold transition-colors"
                        >
                            Enregistrer
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                {/* Desktop Table */}
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Titre</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Lieu</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    Chargement...
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    Aucun événement trouvé.
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-750">
                                    <td className="p-4 font-medium">
                                        <Link href={`/admin/events/${event.id}`} className="hover:text-purple-400 hover:underline">
                                            {event.title}
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        {new Date(event.date).toLocaleString("fr-FR")}
                                    </td>
                                    <td className="p-4">{event.location}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleEditClick(event)}
                                            className="text-blue-400 hover:text-blue-300 mr-3"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
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
                    ) : events.length === 0 ? (
                        <div className="text-center text-gray-400">Aucun événement trouvé.</div>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                                <div className="flex justify-between items-start mb-2">
                                    <Link href={`/admin/events/${event.id}`} className="text-lg font-bold text-white hover:text-purple-400">
                                        {event.title}
                                    </Link>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(event)}
                                            className="text-blue-400 hover:text-blue-300 text-sm"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-300 mb-1">
                                    📅 {new Date(event.date).toLocaleString("fr-FR")}
                                </div>
                                <div className="text-sm text-gray-400">
                                    📍 {event.location || "Lieu non précisé"}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
