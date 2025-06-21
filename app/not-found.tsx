import { headers } from "next/headers";
import Link from "next/link";

export default async function NotFound() {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
            <Link
                href="/dashboard"
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300"
            >
                Return to Dashboard
            </Link>
        </div>
    );
} 