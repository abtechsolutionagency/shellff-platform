
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, Settings, Search, ChevronDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "admin" | "artist" | "playlist" | "live" | "discovery" | "maintenance";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  isNew?: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "admin",
    title: "Admin broadcast: New feature live",
    message: "AI-powered playlist generation is now available. Create personalized playlists based on your listening history and mood.",
    time: "30m ago",
    isRead: false,
    isNew: true
  },
  {
    id: "2",
    type: "artist",
    title: "New album from Taylor Swift",
    message: 'Your followed artist Taylor Swift just released "Midnights (3am Edition)" - check it out now!',
    time: "2h ago",
    isRead: false,
    isNew: true
  },
  {
    id: "3",
    type: "playlist",
    title: "Playlist collaboration invite",
    message: 'Sarah invited you to collaborate on "Summer Vibes 2024" playlist. Accept the invitation to start adding tracks.',
    time: "4h ago",
    isRead: true
  },
  {
    id: "4",
    type: "live",
    title: "The Weeknd is going live",
    message: "Your favorite artist is starting a live listening session for their new album. Join now to listen together with fans.",
    time: "6h ago",
    isRead: false,
    isNew: true
  },
  {
    id: "5",
    type: "discovery",
    title: "Weekly discovery ready",
    message: "Your personalized Weekly Discovery playlist has been updated with 30 new songs based on your recent listening.",
    time: "1d ago",
    isRead: true
  },
  {
    id: "6",
    type: "maintenance",
    title: "Maintenance scheduled",
    message: "Shellff will undergo scheduled maintenance on Sunday, Dec 15th from 2:00-4:00 AM EST. Limited functionality expected.",
    time: "2d ago",
    isRead: true
  }
];

export function NotificationsContent() {
  const { data: session } = useSession() || {};
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<"all" | "creator">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "admin":
        return "📢";
      case "artist":
        return "🎵";
      case "playlist":
        return "📝";
      case "live":
        return "🔴";
      case "discovery":
        return "🎯";
      case "maintenance":
        return "⚙️";
      default:
        return "📱";
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "creator") {
      return matchesSearch && (notification.type === "artist" || notification.type === "live");
    }
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Main Content */}
      <main className="md:ml-60 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Bell className="h-8 w-8 text-purple-400" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs h-5 w-5 flex items-center justify-center p-0">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Notifications
                <Settings className="h-6 w-6 text-gray-400" />
              </h1>
              <p className="text-gray-400">{unreadCount} unread notifications</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                className={filter === "all" ? "bg-purple-600 hover:bg-purple-700" : "border-gray-600 text-gray-300"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "creator" ? "default" : "outline"}
                className={filter === "creator" ? "bg-purple-600 hover:bg-purple-700" : "border-gray-600 text-gray-300"}
                onClick={() => setFilter("creator")}
              >
                Creator-only
              </Button>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-gray-600 text-gray-300"
              onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
            >
              <ChevronDown className="h-4 w-4" />
              Newest First
            </Button>
            
            <Button
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white border-green-500"
              onClick={markAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            
            <Button
              variant="outline"
              className="text-red-400 hover:text-red-300 border-red-500/50 hover:border-red-400"
              onClick={clearAll}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border transition-all duration-200 hover:bg-gray-800/70 cursor-pointer ${
                !notification.isRead
                  ? "bg-purple-900/20 border-purple-500/50"
                  : "bg-gray-900/50 border-gray-800"
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon/Indicator */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    {!notification.isRead && (
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-lg">
                        {notification.title}
                        {notification.isNew && (
                          <Badge className="ml-2 bg-purple-600 text-white">New</Badge>
                        )}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300 h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <p className="text-gray-300 mb-3 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-sm">{notification.time}</p>
                      {notification.isNew && (
                        <Badge className="bg-purple-600 text-white">New</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredNotifications.length === 0 && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
                <p className="text-gray-400">
                  {searchQuery ? "No notifications match your search." : "You're all caught up!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
