"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Identifiants invalides");
            } else {
                const session = await getSession();
                if (session?.user?.role === "ADMIN") {
                    router.push("/admin");
                } else {
                    router.push("/dashboard");
                }
                router.refresh();
            }
        } catch (err) {
            setError("Une erreur est survenue");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-full bg-gray-700 mb-4">
                        <span className="text-4xl">🎺</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Connexion
                    </h1>
                    <p className="text-gray-400 mt-2">Espace Membres & Administration</p>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 text-sm flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3.5 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all"
                            placeholder="votre@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3.5 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-purple-900/20"
                    >
                        Se connecter
                    </button>
                </form>
            </div>
        </div>
    );
}
