
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Edit2, Save, X } from "lucide-react";
import Link from "next/link";

export default function AccountSettingsPage() {
  const { data: session, status } = useSession() || {};
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: (session?.user as any)?.firstName || '',
    lastName: (session?.user as any)?.lastName || '',
    email: session?.user?.email || '',
    username: (session?.user as any)?.username || '',
    bio: (session?.user as any)?.bio || '',
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
        <main className="md:ml-60 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-48"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/login");
  }

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return (session?.user as any)?.firstName?.[0]?.toUpperCase() || 'U';
  };

  const handleSave = () => {
    // Here you would implement the actual save logic
    console.log("Saving profile data:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      firstName: (session?.user as any)?.firstName || '',
      lastName: (session?.user as any)?.lastName || '',
      email: session?.user?.email || '',
      username: (session?.user as any)?.username || '',
      bio: (session?.user as any)?.bio || '',
    });
    setIsEditing(false);
  };

  const handleUploadNew = () => {
    // Placeholder for avatar upload functionality
    alert("Avatar upload feature coming soon!");
  };

  const handleRemoveAvatar = () => {
    // Placeholder for avatar removal functionality
    alert("Avatar removal feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white font-poppins">Account Settings</h1>
              <p className="text-gray-400">Manage your personal information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-60 p-6">
        <div className="max-w-2xl">
          {/* Profile Picture */}
          <Card className="bg-gray-900/50 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white font-poppins">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-purple-500/20">
                  <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-teal-500 text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-white font-medium mb-2">Update your profile picture</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleUploadNew}
                    >
                      Upload New
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-gray-600 text-gray-300"
                      onClick={handleRemoveAvatar}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-poppins">Personal Information</CardTitle>
                {!isEditing ? (
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      className="border-gray-600 text-gray-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-700 text-white disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-700 text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    className="bg-gray-800 border-gray-700 text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    disabled={!isEditing}
                    className="bg-gray-800 border-gray-700 text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    disabled={!isEditing}
                    rows={4}
                    className="bg-gray-800 border-gray-700 text-white disabled:opacity-60"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information (Read-only) */}
          <Card className="bg-gray-900/50 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white font-poppins">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-400 mb-1">User ID</p>
                  <p className="text-white font-mono text-sm">{(session.user as any)?.userId || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Account Type</p>
                  <p className="text-white">{(session.user as any)?.userType || 'Listener'}</p>
                </div>
                {(session.user as any)?.sciId && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Creator ID</p>
                    <p className="text-white font-mono text-sm">{(session.user as any)?.sciId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400 mb-1">Member Since</p>
                  <p className="text-white">2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
