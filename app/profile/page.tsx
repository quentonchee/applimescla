"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";

interface ClothingItem {
    id: string;
    name: string;
    image: string;
}

export default function ProfilePage() {
    const { data: session } = useSession();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        newName: "",
        newEmail: "",
        newInstrument: "",
        newImage: "", // Base64 string
    });
    const [pendingRequest, setPendingRequest] = useState(false);

    // Clothing state
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [newClothingItem, setNewClothingItem] = useState({
        name: "",
        image: "",
    });
    const [isAddingClothing, setIsAddingClothing] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchUserData();
            fetchClothingItems();
        }
    }, [session]);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`/api/users/${session?.user.id}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setEditForm({
                    newName: data.name || "",
                    newEmail: data.email || "",
                    newInstrument: data.instrument || "",
                    newImage: "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch user data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClothingItems = async () => {
        try {
            const res = await fetch("/api/clothing");
            if (res.ok) {
                const data = await res.json();
                setClothingItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch clothing items", error);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm({ ...editForm, newImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClothingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewClothingItem({ ...newClothingItem, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddClothingItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/clothing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newClothingItem),
            });

            if (res.ok) {
                setNewClothingItem({ name: "", image: "" });
                setIsAddingClothing(false);
                fetchClothingItems();
            } else {
                alert("Erreur lors de l'ajout du vêtement.");
            }
        } catch (error) {
            console.error("Failed to add clothing item", error);
        }
    };

    const handleDeleteClothingItem = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce vêtement ?")) return;
        try {
            const res = await fetch(`/api/clothing/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchClothingItems();
            }
        } catch (error) {
            console.error("Failed to delete clothing item", error);
        }
    };

    const handleDownloadCard = () => {
        if (!user) return;

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: [85, 55] // Credit card size
        });

        const img = new Image();
        img.src = "/carte_fond.jpg";
        img.onload = () => {
            doc.addImage(img, "JPEG", 0, 0, 85, 55);

            if (user.image) {
                doc.addImage(user.image, "JPEG", 60, 15, 20, 20);
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`${user.name}`, 5, 35);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`${user.instrument || ""}`, 5, 41);

            doc.setFontSize(10);
            doc.text(`N° ${user.membershipNumber || "..."}`, 5, 47);

            doc.save(`carte_membre_${user.name.replace(/\s+/g, "_")}.pdf`);
        };

        img.onerror = () => {
            alert("Erreur lors du chargement de l'image de fond.");
        };
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/profile/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                alert("Votre demande de modification a été envoyée à l'administrateur.");
                setIsEditing(false);
                setPendingRequest(true);
            } else {
                const err = await res.text();
                alert(`Erreur: ${err}`);
            }
        } catch (error) {
            console.error("Failed to send request", error);
            alert("Une erreur est survenue.");
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Chargement...</div>;
    if (!user) return <div className="p-8 text-center text-white">Utilisateur non trouvé</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-white">
                    Mon Profil
                </h1>
                <a href="/dashboard" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm font-bold">
                    &larr; Retour au Tableau de bord
                </a>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 gap-8 mb-12">
                {/* Info Card */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 order-2 md:order-1">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-purple-400">Mes Informations</h2>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Modifier mes informations"
                        >
                            ✏️ Modifier
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden border-4 border-purple-500 mb-4">
                            {user.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500">Nom complet</label>
                            <p className="text-lg text-white font-medium">{user.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500">Email</label>
                            <p className="text-lg text-white font-medium break-all">{user.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500">Instrument</label>
                            <p className="text-lg text-white font-medium">{user.instrument || "Non spécifié"}</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500">Numéro d'adhérent</label>
                            <p className="text-lg text-green-400 font-bold font-mono">
                                {user.membershipNumber || "Non attribué"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Membership Card Preview */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 flex flex-col items-center justify-center text-center order-1 md:order-2">
                    <h2 className="text-xl font-bold text-purple-400 mb-6">Ma Carte Adhérent</h2>

                    <div className="w-full max-w-[320px] aspect-[85/55] rounded-lg shadow-2xl relative overflow-hidden mb-6 group transition-transform hover:scale-105 mx-auto">
                        <img
                            src="/carte_fond.jpg"
                            alt="Fond Carte"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 p-4 flex flex-col justify-end items-start text-left bg-black/20">
                            {user.image && (
                                <img
                                    src={user.image}
                                    alt="Profile"
                                    className="absolute top-4 right-4 w-16 h-16 rounded-full border-2 border-white object-cover shadow-md"
                                />
                            )}
                            <p className="text-white font-bold text-xl md:text-2xl drop-shadow-md">{user.name}</p>
                            <p className="text-white text-base md:text-lg drop-shadow-md">{user.instrument}</p>
                            <p className="text-green-300 text-xs md:text-sm font-mono mt-1 drop-shadow-md">N° {user.membershipNumber || "..."}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleDownloadCard}
                        className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                        <span>📥</span> Télécharger PDF
                    </button>
                </div>
            </div>

            {/* Clothing Section */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-purple-400">Mes Vêtements (Groupe)</h2>
                    <button
                        onClick={() => setIsAddingClothing(!isAddingClothing)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold transition-colors text-sm"
                    >
                        {isAddingClothing ? "Annuler" : "Ajouter un vêtement"}
                    </button>
                </div>

                {isAddingClothing && (
                    <div className="bg-gray-750 p-4 rounded-lg mb-6 border border-gray-600">
                        <form onSubmit={handleAddClothingItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nom du vêtement</label>
                                <input
                                    type="text"
                                    value={newClothingItem.name}
                                    onChange={(e) => setNewClothingItem({ ...newClothingItem, name: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-500 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                                    placeholder="Ex: T-shirt officiel, Veste..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Photo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-600 rounded overflow-hidden flex items-center justify-center border border-gray-500">
                                        {newClothingItem.image ? (
                                            <img src={newClothingItem.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl">📷</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleClothingImageUpload}
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold transition-colors text-sm"
                            >
                                Enregistrer
                            </button>
                        </form>
                    </div>
                )}

                {clothingItems.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">Aucun vêtement enregistré.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {clothingItems.map((item) => (
                            <div key={item.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600 flex flex-col items-center">
                                <div className="w-full h-48 bg-gray-600 rounded mb-3 overflow-hidden">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="font-bold text-white mb-2">{item.name}</h3>
                                <button
                                    onClick={() => handleDeleteClothingItem(item.id)}
                                    className="text-red-400 hover:text-red-300 text-sm font-bold"
                                >
                                    Supprimer
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-2 text-white">Demande de modification</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Vos modifications seront envoyées à l'administrateur pour validation.
                        </p>

                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                    {editForm.newImage ? (
                                        <img src={editForm.newImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-500 text-2xl">📷</span>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <p className="text-center text-xs text-gray-500 mb-4">Cliquez pour changer la photo</p>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nom complet</label>
                                <input
                                    type="text"
                                    value={editForm.newName}
                                    onChange={(e) => setEditForm({ ...editForm, newName: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.newEmail}
                                    onChange={(e) => setEditForm({ ...editForm, newEmail: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Instrument</label>
                                <input
                                    type="text"
                                    value={editForm.newInstrument}
                                    onChange={(e) => setEditForm({ ...editForm, newInstrument: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-5 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg hover:shadow-purple-500/25"
                                >
                                    Envoyer la demande
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
