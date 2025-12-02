"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
}

export default function AttendancePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchEvents();
    }, []);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Historique des Présences</h2>
            <p className="text-gray-400 mb-8">Sélectionnez un événement pour voir les détails des présences.</p>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                {/* Desktop Table */}
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Événement</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Lieu</th>
                            <th className="p-4">Action</th>
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
                                    <td className="p-4 font-medium">{event.title}</td>
                                    <td className="p-4">
                                        {new Date(event.date).toLocaleString("fr-FR")}
                                    </td>
                                    <td className="p-4">{event.location}</td>
                                    <td className="p-4">
                                        <Link
                                            href={`/admin/events/${event.id}`}
                                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
                                        >
                                            Voir Détails
                                        </Link>
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
                                    <h3 className="font-bold text-white text-lg">{event.title}</h3>
                                    <Link
                                        href={`/admin/events/${event.id}`}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                                    >
                                        Voir
                                    </Link>
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
