import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, MessageSquare, Clock, Zap } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">Welcome to Intellecta</h1>
      <p className="text-gray-400">Your AI-powered assistant dashboard</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-emerald-400 mr-2" />
              <div className="text-2xl font-bold">24</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-cyan-400 mr-2" />
              <div className="text-2xl font-bold">3</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Time Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-400 mr-2" />
              <div className="text-2xl font-bold">12h</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">AI Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-400 mr-2" />
              <div className="text-2xl font-bold">850</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">Your latest interactions with Intellecta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                    <MessageSquare className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium">Chat Session #{item}</p>
                    <p className="text-sm text-gray-400">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">Get started with Intellecta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/dashboard/chat">
                <button className="w-full p-4 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40">
                  Start New Chat
                </button>
              </Link>
              <Link href="/dashboard/history">
                <button className="w-full p-4 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-all duration-300">
                  View Chat History
                </button>
              </Link>
              <Link href="/dashboard/settings">
                <button className="w-full p-4 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-all duration-300">
                  Manage AI Settings
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}