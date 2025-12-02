"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function ChangePasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });

            if (!res.ok) {
                throw new Error("Failed to update password");
            }

            // Force re-login or update session
            // Simplest is to sign out and ask to login again with new password
            await signOut({ callbackUrl: "/login" });
        } catch (err) {
            setError("Une erreur est survenue");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Changer le mot de passe
                </h1>
                <p className="text-gray-400 mb-6 text-center">
                    Pour votre sécurité, vous devez changer votre mot de passe lors de la première connexion.
                </p>
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Nouveau mot de passe</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded transition-all transform hover:scale-[1.02]"
                    >
                        Mettre à jour le mot de passe
                    </button>
                </form>
            </div>
        </div>
    );
}
