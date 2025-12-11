"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    isClosed: boolean;
    userStatus: "PRESENT" | "ABSENT" | null;
}

export default function UserDashboard() {
    const { data: session } = useSession();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/attendance");
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

    const handleAttendance = async (eventId: string, status: "PRESENT" | "ABSENT") => {
        setUpdating(eventId);
        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, status }),
            });

            if (res.ok) {
                // Update local state
                setEvents(events.map(e =>
                    e.id === eventId ? { ...e, userStatus: status } : e
                ));
            }
        } catch (error) {
            console.error("Failed to update attendance", error);
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            Bonjour, {session?.user?.name || "Musicien"} !
                        </h1>
                        <p className="text-gray-400 mt-1">Voici les événements à venir.</p>
                    </div>
                    <div className="flex gap-4">

                        {(session?.user?.role === "ADMIN" || session?.user?.roles?.includes("ADMIN")) && (
                            <Link
                                href="/admin"
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded transition-colors text-sm font-bold"
                            >
                                Administration
                            </Link>
                        )}
                        <Link
                            href="/profile"
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm font-bold"
                        >
                            Mon Profil
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm"
                        >
                            Se déconnecter
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Chargement des événements...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                        <p className="text-xl text-gray-400">Aucun événement à venir.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {events.map((event) => {
                            return (
                                <div
                                    key={event.id}
                                    className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-gray-600 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
                                            <div className="flex items-center text-gray-300 mb-1">
                                                <span className="mr-2">📅</span>
                                                {new Date(event.date).toLocaleString("fr-FR", {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                            <div className="flex items-center text-gray-400">
                                                <span className="mr-2">📍</span>
                                                {event.location}
                                            </div>
                                            {event.description && (
                                                <p className="mt-3 text-gray-400 text-sm bg-gray-900/50 p-3 rounded">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-3 shrink-0">
                                            {event.isClosed ? (
                                                <div className="flex items-center justify-center bg-red-900/30 border border-red-900 text-red-400 px-6 py-3 rounded-lg font-bold">
                                                    🔒 Inscriptions Closes
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleAttendance(event.id, "PRESENT")}
                                                        disabled={updating === event.id}
                                                        className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${event.userStatus === "PRESENT"
                                                            ? "bg-green-600 text-white ring-2 ring-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                            }`}
                                                    >
                                                        <span>👍</span> Présent
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendance(event.id, "ABSENT")}
                                                        disabled={updating === event.id}
                                                        className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${event.userStatus === "ABSENT"
                                                            ? "bg-red-600 text-white ring-2 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                            }`}
                                                    >
                                                        <span>👎</span> Absent
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
