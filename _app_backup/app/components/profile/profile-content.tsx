
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Calendar, Edit, Verified } from "lucide-react";
import { UserType } from "@prisma/client";
import { ProfileEditModal } from "./profile-edit-modal";
import { RoleSwitchModal } from "./role-switch-modal";

interface ProfileContentProps {
  user: {
    id: string;
    userId?: string;
    sciId?: string | null;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    userType: UserType;
    avatar: string | null;
    profilePicture?: string | null;
    bio: string | null;
    isVerified: boolean;
    createdAt: Date;
  };
}

export function ProfileContent({ user }: ProfileContentProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getUserInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card className="mb-8 bg-shellff-dark border-shellff-accent">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profilePicture || user.avatar || undefined} alt={fullName} />
              <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white font-poppins">{fullName}</h1>
                {user.isVerified && (
                  <Verified className="h-5 w-5 text-shellff-purple" />
                )}
              </div>
              <p className="text-shellff-neutral font-inter">@{user.username}</p>
              <div className="flex items-center gap-2">
                <Badge variant={user.userType === 'CREATOR' ? "default" : "secondary"} 
                       className={user.userType === 'CREATOR' 
                         ? "bg-shellff-purple/20 text-shellff-purple border-shellff-purple/30" 
                         : "bg-shellff-teal/20 text-shellff-teal border-shellff-teal/30"}>
                  {user.userType}
                </Badge>
                {user.sciId && (
                  <Badge variant="outline" className="border-shellff-accent text-shellff-neutral">
                    ID: {user.sciId}
                  </Badge>
                )}
              </div>
              {user.bio && (
                <p className="text-sm text-shellff-neutral mt-2 font-inter">{user.bio}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <ProfileEditModal user={user} />
              <RoleSwitchModal 
                currentRole={user.userType} 
                username={user.username}
                sciId={user.sciId}
                isRoleRestricted={
                  user.email === 'creatoronly@shellff.com' ||
                  (user as any)?.settings?.roleRestrictedToCreator === true
                }
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-shellff-dark border-shellff-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white font-poppins">
              <User className="h-5 w-5 text-shellff-purple" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-shellff-neutral" />
              <span className="text-sm text-white font-inter">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-shellff-neutral" />
              <span className="text-sm text-white font-inter">Joined {joinDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-shellff-neutral" />
              <span className="text-sm text-white font-inter">ID: {user.id.slice(0, 8)}...</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-shellff-dark border-shellff-accent">
          <CardHeader>
            <CardTitle className="text-white font-poppins">
              {user.userType === 'CREATOR' ? 'Creator Stats' : 'Listening Stats'}
            </CardTitle>
            <CardDescription className="text-shellff-neutral font-inter">
              {user.userType === 'CREATOR' 
                ? 'Your content creation overview'
                : 'Your music listening activity'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-shellff-neutral font-inter">
                  {user.userType === 'CREATOR' ? 'Tracks Uploaded' : 'Songs Played'}
                </span>
                <span className="text-sm font-medium text-white font-inter">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-shellff-neutral font-inter">
                  {user.userType === 'CREATOR' ? 'Total Plays' : 'Playlists Created'}
                </span>
                <span className="text-sm font-medium text-white font-inter">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-shellff-neutral font-inter">
                  {user.userType === 'CREATOR' ? 'Followers' : 'Following'}
                </span>
                <span className="text-sm font-medium text-white font-inter">0</span>
              </div>
              <p className="text-xs text-shellff-neutral mt-4 font-inter">
                Statistics will be available in upcoming releases.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
