"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface UserHistory {
    user: {
        id: string;
        name: string;
        email: string;
        instrument: string;
        role: string;
        roles: { name: string }[];
        clothingItems: { id: string; name: string; image: string }[];
        createdAt: string;
        membershipNumber?: string;
    };
    history: {
        eventId: string;
        title: string;
        date: string;
        location: string;
        status: "PRESENT" | "ABSENT" | "NO_RESPONSE";
    }[];
    stats: {
        totalEvents: number;
        presentCount: number;
        absentCount: number;
        noResponseCount: number;
        participationRate: number;
    };
}

export default function UserDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const [data, setData] = useState<UserHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfFilter, setPdfFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/users/${id}/history`);
                if (res.ok) {
                    const json = await res.json();

                    // Fetch full user details to ensure we get clothing items
                    const userRes = await fetch(`/api/users/${id}`);
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        json.user = userData; // Merge full user data including clothing
                    }

                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch user history", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const downloadPDF = () => {
        if (!data) return;

        const doc = new jsPDF();

        // Title & User Info
        doc.setFontSize(20);
        doc.text(`Historique : ${data.user.name}`, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Instrument : ${data.user.instrument || "N/A"}`, 14, 30);
        doc.text(`Email : ${data.user.email}`, 14, 36);

        // Stats Box
        doc.setDrawColor(147, 51, 234); // Purple
        doc.setLineWidth(0.5);
        doc.rect(14, 42, 180, 25);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Taux de Présence : ${data.stats.participationRate}%`, 20, 52);
        doc.setFontSize(10);
        doc.text(`Présences : ${data.stats.presentCount}`, 20, 60);
        doc.text(`Absences : ${data.stats.absentCount}`, 80, 60);
        doc.text(`Sans Réponse : ${data.stats.noResponseCount}`, 140, 60);

        // Filter Data
        let filteredHistory = data.history;
        if (pdfFilter === "PRESENT") {
            filteredHistory = data.history.filter(h => h.status === "PRESENT");
        } else if (pdfFilter === "ABSENT") {
            filteredHistory = data.history.filter(h => h.status === "ABSENT");
        }

        // Table
        const tableData = filteredHistory.map(h => [
            new Date(h.date).toLocaleDateString("fr-FR"),
            h.title,
            h.location || "-",
            h.status === "PRESENT" ? "Présent" : h.status === "ABSENT" ? "Absent" : "Sans réponse"
        ]);

        autoTable(doc, {
            head: [["Date", "Événement", "Lieu", "Statut"]],
            body: tableData,
            startY: 75,
            theme: 'grid',
            headStyles: { fillColor: [147, 51, 234] },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 3) {
                    const status = data.cell.raw;
                    if (status === 'Présent') data.cell.styles.textColor = [22, 163, 74]; // Green
                    if (status === 'Absent') data.cell.styles.textColor = [220, 38, 38]; // Red
                }
            }
        });

        doc.save(`historique_${data.user.name.replace(/\s+/g, "_")}_${pdfFilter}.pdf`);
    };

    const downloadFullProfilePDF = () => {
        if (!data) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(24);
        doc.setTextColor(147, 51, 234); // Purple
        doc.text("Fiche Musicien", pageWidth / 2, 20, { align: "center" });

        // User Info Section
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Informations Personnelles", 14, 40);
        doc.setDrawColor(200);
        doc.line(14, 42, pageWidth - 14, 42);

        doc.setFontSize(11);
        doc.setTextColor(80);
        let yPos = 50;
        doc.text(`Nom : ${data.user.name}`, 20, yPos); yPos += 8;
        doc.text(`Email : ${data.user.email}`, 20, yPos); yPos += 8;
        doc.text(`Instrument : ${data.user.instrument || "Non spécifié"}`, 20, yPos); yPos += 8;
        doc.text(`Numéro d'adhérent : ${data.user.membershipNumber || "Non attribué"}`, 20, yPos); yPos += 8;
        doc.text(`Rôles : ${data.user.roles?.map(r => r.name).join(", ") || "Aucun"}`, 20, yPos); yPos += 15;

        // Stats Section
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Statistiques de Présence", 14, yPos);
        doc.setDrawColor(200);
        doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
        yPos += 10;

        doc.setFontSize(11);
        doc.setTextColor(80);
        doc.text(`Taux de participation : ${data.stats.participationRate}%`, 20, yPos); yPos += 8;
        doc.text(`Total événements : ${data.stats.totalEvents}`, 20, yPos); yPos += 8;
        doc.text(`Présences : ${data.stats.presentCount}`, 20, yPos); yPos += 8;
        doc.text(`Absences : ${data.stats.absentCount}`, 20, yPos); yPos += 15;

        // Clothing Section
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Vêtements & Équipements", 14, yPos);
        doc.setDrawColor(200);
        doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
        yPos += 10;

        if (data.user.clothingItems && data.user.clothingItems.length > 0) {
            let xPos = 20;
            const imgWidth = 40;
            const imgHeight = 40;

            data.user.clothingItems.forEach((item, index) => {
                // Check if we need a new page
                if (yPos + imgHeight + 10 > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    yPos = 20;
                }

                if (item.image) {
                    try {
                        doc.addImage(item.image, "JPEG", xPos, yPos, imgWidth, imgHeight);
                    } catch (e) {
                        doc.text("[Image non valide]", xPos, yPos + 20);
                    }
                } else {
                    doc.rect(xPos, yPos, imgWidth, imgHeight);
                    doc.text("No Image", xPos + 5, yPos + 20);
                }

                doc.setFontSize(10);
                doc.text(item.name, xPos, yPos + imgHeight + 5);

                xPos += imgWidth + 10;
                if (xPos + imgWidth > pageWidth - 14) {
                    xPos = 20;
                    yPos += imgHeight + 15;
                }
            });
        } else {
            doc.setFontSize(11);
            doc.setTextColor(80);
            doc.text("Aucun vêtement enregistré.", 20, yPos);
        }

        doc.save(`fiche_complete_${data.user.name.replace(/\s+/g, "_")}.pdf`);
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (!data) return <div className="p-8 text-center">Utilisateur non trouvé</div>;

    return (
        <div>
            <div className="mb-6">
                <Link href="/admin/users" className="text-gray-400 hover:text-white mb-4 inline-block">
                    &larr; Retour aux Musiciens
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            {data.user.name || data.user.email}
                        </h1>
                        <p className="text-xl text-gray-300 mt-2">
                            {data.user.instrument || "Instrument non spécifié"}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={downloadFullProfilePDF}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors shadow-lg"
                        >
                            <span>📑</span> Fiche Complète
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 mb-1">Taux de Présence</h3>
                    <p className="text-3xl font-bold text-white">{data.stats.participationRate}%</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-green-900/50">
                    <h3 className="text-sm font-bold text-green-400 mb-1">Présences</h3>
                    <p className="text-3xl font-bold text-white">{data.stats.presentCount}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-red-900/50">
                    <h3 className="text-sm font-bold text-red-400 mb-1">Absences</h3>
                    <p className="text-3xl font-bold text-white">{data.stats.absentCount}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 mb-1">Sans Réponse</h3>
                    <p className="text-3xl font-bold text-white">{data.stats.noResponseCount}</p>
                </div>
            </div>

            {/* Clothing Section */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mb-8 p-6">
                <h3 className="text-xl font-bold text-purple-400 mb-4">Vêtements & Équipements</h3>
                {data.user.clothingItems && data.user.clothingItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {data.user.clothingItems.map((item) => (
                            <div key={item.id} className="bg-gray-700 p-3 rounded border border-gray-600">
                                <div className="w-full h-32 bg-gray-600 rounded mb-2 overflow-hidden">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <p className="text-white font-medium text-center text-sm">{item.name}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">Aucun vêtement enregistré pour ce musicien.</p>
                )}
            </div>

            {/* History Table */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                <div className="flex justify-between items-center p-4 bg-gray-700">
                    <h3 className="font-bold text-gray-300">Historique des Événements</h3>
                    <div className="flex items-center gap-3">
                        <select
                            value={pdfFilter}
                            onChange={(e) => setPdfFilter(e.target.value as any)}
                            className="bg-gray-600 text-white text-xs rounded p-1 border border-gray-500 focus:outline-none"
                        >
                            <option value="ALL">Tout</option>
                            <option value="PRESENT">Présences</option>
                            <option value="ABSENT">Absences</option>
                        </select>
                        <button
                            onClick={downloadPDF}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                        >
                            <span>📄</span> PDF Historique
                        </button>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-750 text-gray-400">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Événement</th>
                            <th className="p-4">Lieu</th>
                            <th className="p-4">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {data.history.map((event) => (
                            <tr key={event.eventId} className="hover:bg-gray-700/50">
                                <td className="p-4 text-gray-300">
                                    {new Date(event.date).toLocaleDateString("fr-FR")}
                                </td>
                                <td className="p-4 font-medium text-white">
                                    {event.title}
                                </td>
                                <td className="p-4 text-gray-400">
                                    {event.location}
                                </td>
                                <td className="p-4">
                                    {event.status === "PRESENT" && (
                                        <span className="text-green-400 font-bold">Présent</span>
                                    )}
                                    {event.status === "ABSENT" && (
                                        <span className="text-red-400 font-bold">Absent</span>
                                    )}
                                    {event.status === "NO_RESPONSE" && (
                                        <span className="text-gray-500 italic">Pas de réponse</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {data.history.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    Aucun historique disponible.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
