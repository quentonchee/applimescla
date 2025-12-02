import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
    const userCount = await prisma.user.count({ where: { role: "USER" } });
    const eventCount = await prisma.event.count();
    const upcomingEvents = await prisma.event.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 5,
    });

    const stats = {
        userCount,
        eventCount,
        upcomingEvents,
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Vue d'ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-gray-400 font-bold uppercase text-sm">Musiciens</h3>
                    <p className="text-4xl font-bold text-white mt-2">{stats.userCount}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h3 className="text-gray-400 font-bold uppercase text-sm">Événements</h3>
                    <p className="text-4xl font-bold text-white mt-2">{stats.eventCount}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-purple-900/50">
                    <h3 className="text-purple-400 font-bold uppercase text-sm">À venir</h3>
                    <p className="text-4xl font-bold text-white mt-2">{stats.upcomingEvents.length}</p>
                </div>
            </div>

            <h3 className="text-2xl font-bold mb-4">Prochains Événements</h3>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                {/* Desktop Table */}
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Titre</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Lieu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.upcomingEvents.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400">
                                    Aucun événement à venir.
                                </td>
                            </tr>
                        ) : (
                            stats.upcomingEvents.map((event: any) => (
                                <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-750">
                                    <td className="p-4 font-medium">{event.title}</td>
                                    <td className="p-4">
                                        {new Date(event.date).toLocaleString("fr-FR")}
                                    </td>
                                    <td className="p-4">{event.location}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                    {stats.upcomingEvents.length === 0 ? (
                        <div className="text-center text-gray-400">Aucun événement à venir.</div>
                    ) : (
                        stats.upcomingEvents.map((event: any) => (
                            <div key={event.id} className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                                <h4 className="font-bold text-white text-lg mb-1">{event.title}</h4>
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
