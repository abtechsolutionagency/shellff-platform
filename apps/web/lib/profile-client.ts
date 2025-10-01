export type ProfileStats = {
  tracksPlayed?: number;
  following?: number;
  shcEarned?: number;
};

export type ProfileTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
};

export type ProfilePlaylist = {
  id: string;
  name: string;
  trackCount: number;
};

export type ProfileActivity = {
  id: string;
  type: string;
  description: string;
  time: string;
};

export type ProfileApiResponse = {
  user: {
    id: string;
    userId?: string | null;
    sciId?: string | null;
    username?: string | null;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    userType?: string | null;
    avatar?: string | null;
    profilePicture?: string | null;
    bio?: string | null;
    isVerified?: boolean;
    createdAt?: string;
    userSettings?: Record<string, unknown> | null;
  };
  stats?: ProfileStats;
  recentlyPlayed?: ProfileTrack[];
  playlists?: ProfilePlaylist[];
  recentActivity?: ProfileActivity[];
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
};

export type UpdateProfileResponse = {
  user: {
    id?: string;
    userId?: string | null;
    sciId?: string | null;
    username?: string | null;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    userType?: string | null;
    avatar?: string | null;
    profilePicture?: string | null;
    bio?: string | null;
    isVerified?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export type SwitchRolePayload = {
  newRole: 'LISTENER' | 'CREATOR';
};

export type SwitchRoleResponse = {
  message: string;
  user?: {
    id: string;
    userType: 'LISTENER' | 'CREATOR';
    sciId: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
};

const parseJsonSafely = async (response: Response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export async function fetchProfile(signal?: AbortSignal): Promise<ProfileApiResponse> {
  const response = await fetch("/api/profile", { signal });
  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(body?.error ?? "Unable to load profile");
  }

  return body as ProfileApiResponse;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UpdateProfileResponse> {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to update profile");
  }

  return body as UpdateProfileResponse;
}

export async function uploadAvatar(file: File | Blob, fileName = "avatar.png"): Promise<{ profilePicture?: string }> {
  const formData = new FormData();
  formData.append("avatar", file, fileName);

  const response = await fetch("/api/profile/avatar", {
    method: "POST",
    body: formData,
  });

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to upload avatar");
  }

  return body as { profilePicture?: string };
}

export async function removeAvatar(): Promise<void> {
  const response = await fetch("/api/profile/avatar", {
    method: "DELETE",
  });

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to remove avatar");
  }
}

export async function changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponse> {
  const response = await fetch("/api/profile/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to change password");
  }

  return (body as ChangePasswordResponse) ?? { message: "Password updated successfully" };
}

export async function switchRole(payload: SwitchRolePayload): Promise<SwitchRoleResponse> {
  const response = await fetch("/api/profile/role-switch", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to switch role");
  }

  return body as SwitchRoleResponse;
}
