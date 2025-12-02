"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Request {
    id: string;
    userId: string;
    newName: string | null;
    newEmail: string | null;
    newInstrument: string | null;
    status: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
        instrument: string | null;
        membershipNumber: string | null;
    };
}

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/profile/request");
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
        try {
            const res = await fetch("/api/profile/request", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action }),
            });

            if (res.ok) {
                // Remove the processed request from the list
                setRequests((prev) => prev.filter((r) => r.id !== requestId));
                alert(action === "APPROVE" ? "Demande validée !" : "Demande refusée.");
            } else {
                alert("Erreur lors du traitement de la demande.");
            }
        } catch (error) {
            console.error("Failed to process request", error);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Chargement...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Demandes de Modification</h1>
                <Link href="/admin/users" className="text-gray-400 hover:text-white transition-colors">
                    &larr; Retour aux Utilisateurs
                </Link>
            </div>

            {requests.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
                    <p className="text-xl text-gray-400">Aucune demande en attente. Tout est à jour ! 🎉</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-xl font-bold text-white">{req.user.name}</h2>
                                    <span className="text-sm text-gray-500 bg-gray-900 px-2 py-1 rounded">
                                        Adhérent: {req.user.membershipNumber || "N/A"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                        <p className="text-gray-500 mb-1 uppercase text-xs font-bold">Actuel</p>
                                        <p><span className="text-gray-400">Nom:</span> <span className="text-white">{req.user.name}</span></p>
                                        <p><span className="text-gray-400">Email:</span> <span className="text-white">{req.user.email}</span></p>
                                        <p><span className="text-gray-400">Instrument:</span> <span className="text-white">{req.user.instrument || "Non spécifié"}</span></p>
                                    </div>

                                    <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                                        <p className="text-purple-400 mb-1 uppercase text-xs font-bold">Demandé</p>
                                        {req.newName && req.newName !== req.user.name && (
                                            <p><span className="text-gray-400">Nom:</span> <span className="text-green-400 font-bold">{req.newName}</span></p>
                                        )}
                                        {req.newEmail && req.newEmail !== req.user.email && (
                                            <p><span className="text-gray-400">Email:</span> <span className="text-green-400 font-bold">{req.newEmail}</span></p>
                                        )}
                                        {req.newInstrument && req.newInstrument !== req.user.instrument && (
                                            <p><span className="text-gray-400">Instrument:</span> <span className="text-green-400 font-bold">{req.newInstrument}</span></p>
                                        )}
                                        {!req.newName && !req.newEmail && !req.newInstrument && (
                                            <p className="text-gray-500 italic">Aucune modification détectée (bug ?)</p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    Demandé le {new Date(req.createdAt).toLocaleString("fr-FR")}
                                </p>
                            </div>

                            <div className="flex flex-col justify-center gap-3 min-w-[150px]">
                                <button
                                    onClick={() => handleAction(req.id, "APPROVE")}
                                    className="bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    <span>✅</span> Valider
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, "REJECT")}
                                    className="bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    <span>❌</span> Refuser
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
