"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface User {
    id: string;
    name: string;
    email: string;
    instrument?: string;
}

interface Attendance {
    status: "PRESENT" | "ABSENT";
    user: User;
    userId: string;
    updatedAt: string;
}

interface AttendanceHistory {
    id: string;
    status: "PRESENT" | "ABSENT";
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
}

interface EventDetails {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    isClosed: boolean;
    attendances: Attendance[];
    attendanceHistory: AttendanceHistory[];
}

export default function EventDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
    const [showHistory, setShowHistory] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        date: "",
        location: "",
        description: "",
    });

    useEffect(() => {
        if (event) {
            setEditForm({
                title: event.title,
                date: new Date(event.date).toISOString().slice(0, 16), // Format for datetime-local
                location: event.location || "",
                description: event.description || "",
            });
        }
    }, [event]);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                const updatedEvent = await res.json();
                setEvent((prev) => prev ? { ...prev, ...updatedEvent } : null);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Failed to update event", error);
        }
    };

    const toggleClosure = async () => {
        if (!event) return;
        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isClosed: !event.isClosed }),
            });
            if (res.ok) {
                const updatedEvent = await res.json();
                setEvent((prev) => prev ? { ...prev, isClosed: updatedEvent.isClosed } : null);
            }
        } catch (error) {
            console.error("Failed to update event status", error);
        }
    };

    const downloadPDF = () => {
        if (!event) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(event.title, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`${new Date(event.date).toLocaleString("fr-FR")} - ${event.location || ""}`, 14, 30);

        // Stats
        const presentCount = event.attendances.filter(a => a.status === "PRESENT").length;
        doc.text(`Présents: ${presentCount}`, 14, 40);

        // Table Data
        const presentAttendees = event.attendances
            .filter(a => a.status === "PRESENT")
            .sort((a, b) => (a.user.instrument || "").localeCompare(b.user.instrument || ""));

        const tableData = presentAttendees.map(att => [
            att.user.name,
            att.user.instrument || "Non spécifié",
            att.user.email
        ]);

        autoTable(doc, {
            head: [["Nom", "Instrument", "Email"]],
            body: tableData,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [147, 51, 234] }, // Purple
        });

        doc.save(`presence_${event.title.replace(/\s+/g, "_")}.pdf`);
    };

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/events/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data.event);
                    setAllUsers(data.allUsers);
                }
            } catch (error) {
                console.error("Erreur lors du chargement de l'événement", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (!event) return <div className="p-8 text-center">Événement non trouvé</div>;

    // Process data
    const present = event.attendances.filter((a) => a.status === "PRESENT");
    const absent = event.attendances.filter((a) => a.status === "ABSENT");

    const respondedUserIds = new Set(event.attendances.map((a) => a.userId));
    const noResponse = allUsers.filter((u) => !respondedUserIds.has(u.id));

    // Filtered list for the table
    let displayedAttendances = event.attendances;
    if (filter === "PRESENT") displayedAttendances = present;
    if (filter === "ABSENT") displayedAttendances = absent;

    // Group present users by instrument
    const presentByInstrument = present.reduce((acc, curr) => {
        const instrument = curr.user.instrument || "Autre / Non spécifié";
        if (!acc[instrument]) acc[instrument] = [];
        acc[instrument].push(curr);
        return acc;
    }, {} as Record<string, typeof present>);

    return (
        <div>
            {/* Edit Modal */}
            {isEditing && (
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
                                    onClick={() => setIsEditing(false)}
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

            <div className="mb-6">
                <Link href="/admin/events" className="text-gray-400 hover:text-white mb-4 inline-block">
                    &larr; Retour aux Événements
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                {event.title}
                            </h1>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Modifier l'événement"
                            >
                                ✏️
                            </button>
                        </div>
                        <p className="text-xl text-gray-300 mt-2">
                            {new Date(event.date).toLocaleString("fr-FR")}
                        </p>
                        <p className="text-gray-400">{event.location}</p>
                        {event.description && (
                            <p className="text-gray-500 text-sm mt-1 italic">{event.description}</p>
                        )}
                        <div className="mt-2">
                            {event.isClosed ? (
                                <span className="bg-red-900 text-red-200 px-2 py-1 rounded text-xs font-bold border border-red-700">
                                    INSCRIPTIONS CLOSES
                                </span>
                            ) : (
                                <span className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs font-bold border border-green-700">
                                    INSCRIPTIONS OUVERTES
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                        <button
                            onClick={downloadPDF}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2"
                        >
                            <span>📄</span> Télécharger PDF
                        </button>
                        <button
                            onClick={toggleClosure}
                            className={`px-4 py-2 rounded text-sm font-bold transition-colors ${event.isClosed
                                ? "bg-green-600 hover:bg-green-500 text-white"
                                : "bg-red-600 hover:bg-red-500 text-white"
                                }`}
                        >
                            {event.isClosed ? "Ouvrir Inscriptions" : "Clôturer Inscriptions"}
                        </button>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
                        >
                            {showHistory ? "Masquer l'historique" : "Voir l'historique"}
                        </button>
                    </div>
                </div>
            </div>

            {showHistory && (
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mb-8 animate-fade-in">
                    <h3 className="bg-gray-700 p-4 font-bold text-gray-300">📜 Journal d'activité (Traceability)</h3>
                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-750 text-gray-400 sticky top-0">
                                <tr>
                                    <th className="p-3">Heure</th>
                                    <th className="p-3">Utilisateur</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {event.attendanceHistory.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-700/50">
                                        <td className="p-3 text-gray-500">
                                            {new Date(log.createdAt).toLocaleString("fr-FR")}
                                        </td>
                                        <td className="p-3 font-medium">
                                            {log.user.name || log.user.email}
                                        </td>
                                        <td className="p-3">
                                            {log.status === "PRESENT" ? (
                                                <span className="text-green-400">A marqué <b>Présent</b></span>
                                            ) : (
                                                <span className="text-red-400">A marqué <b>Absent</b></span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {event.attendanceHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-center text-gray-500">Aucune activité récente.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-green-900/50">
                    <h3 className="text-xl font-bold text-green-400 mb-2">Présents</h3>
                    <p className="text-4xl font-bold text-white mt-2">{present.length}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-red-900/50">
                    <h3 className="text-xl font-bold text-red-400 mb-2">Absents</h3>
                    <p className="text-4xl font-bold text-white mt-2">{absent.length}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-gray-400 mb-2">Non répondu</h3>
                    <p className="text-4xl font-bold text-white mt-2">{noResponse.length}</p>
                </div>
            </div>

            <div className="mb-6 flex gap-2">
                <button
                    onClick={() => setFilter("ALL")}
                    className={`px-4 py-2 rounded font-bold ${filter === "ALL" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"}`}
                >
                    Tous
                </button>
                <button
                    onClick={() => setFilter("PRESENT")}
                    className={`px-4 py-2 rounded font-bold ${filter === "PRESENT" ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"}`}
                >
                    Présents
                </button>
                <button
                    onClick={() => setFilter("ABSENT")}
                    className={`px-4 py-2 rounded font-bold ${filter === "ABSENT" ? "bg-red-600 text-white" : "bg-gray-700 text-gray-300"}`}
                >
                    Absents
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                {filter === "PRESENT" ? (
                    <div className="p-4">
                        {Object.entries(presentByInstrument).map(([instrument, attendees]) => (
                            <div key={instrument} className="mb-6 last:mb-0">
                                <h3 className="text-lg font-bold text-purple-400 border-b border-gray-700 pb-2 mb-3">
                                    {instrument} ({attendees.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {attendees.map((att) => (
                                        <div key={att.userId} className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                                            <span className="font-medium">{att.user.name || att.user.email}</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(att.updatedAt).toLocaleDateString("fr-FR")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {present.length === 0 && (
                            <div className="text-center text-gray-500 py-8">Aucun musicien présent.</div>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Desktop Table */}
                        <table className="w-full text-left hidden md:table">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-4">Nom</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Statut</th>
                                    <th className="p-4">Date de réponse</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {displayedAttendances.map((att) => (
                                    <tr key={att.userId} className="border-b border-gray-700 hover:bg-gray-750">
                                        <td className="p-4 font-medium">{att.user.name || att.user.email}</td>
                                        <td className="p-4">{att.user.email}</td>
                                        <td className="p-4">
                                            {att.status === "PRESENT" ? (
                                                <span className="text-green-400 font-bold">Présent</span>
                                            ) : (
                                                <span className="text-red-400 font-bold">Absent</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            {new Date(att.updatedAt).toLocaleString("fr-FR")}
                                        </td>
                                    </tr>
                                ))}
                                {filter === "ALL" && noResponse.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750 opacity-50">
                                        <td className="p-4 font-medium">{user.name}</td>
                                        <td className="p-4">{user.email}</td>
                                        <td className="p-4 text-gray-500 italic">Pas de réponse</td>
                                        <td className="p-4">-</td>
                                    </tr>
                                ))}
                                {displayedAttendances.length === 0 && filter !== "ALL" && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">Aucune donnée.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3 p-4">
                            {displayedAttendances.map((att) => (
                                <div key={att.userId} className="bg-gray-750 p-3 rounded border border-gray-600 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-white">{att.user.name || att.user.email}</div>
                                        <div className="text-xs text-gray-400">{att.user.email}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(att.updatedAt).toLocaleDateString("fr-FR")}
                                        </div>
                                    </div>
                                    <div>
                                        {att.status === "PRESENT" ? (
                                            <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-900">Présent</span>
                                        ) : (
                                            <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-900">Absent</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filter === "ALL" && noResponse.map((user) => (
                                <div key={user.id} className="bg-gray-750/50 p-3 rounded border border-gray-700 flex justify-between items-center opacity-75">
                                    <div>
                                        <div className="font-bold text-gray-300">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                    <span className="text-gray-500 text-xs italic">Pas de réponse</span>
                                </div>
                            ))}
                            {displayedAttendances.length === 0 && filter !== "ALL" && (
                                <div className="text-center text-gray-500 py-4">Aucune donnée.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mt-8">
                <h3 className="bg-gray-700 p-4 font-bold text-gray-400">⏳ En attente de réponse ({noResponse.length})</h3>
                <ul className="divide-y divide-gray-700 grid grid-cols-1 md:grid-cols-3">
                    {noResponse.map((u) => (
                        <li key={u.id} className="p-4 text-gray-400">
                            {u.name || u.email}
                        </li>
                    ))}
                    {noResponse.length === 0 && <li className="p-4 text-gray-500 col-span-3">Tout le monde a répondu !</li>}
                </ul>
            </div>
        </div>
    );
}
