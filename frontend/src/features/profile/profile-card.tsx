import type React from "react";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload, UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useUpdateProfileImageMutation,
  useUpdateProfileMutation,
} from "@/hooks/use-profile-query";
import { useCachedProfileImage } from "@/hooks/use-cached-profile-image";

export default function ProfileCard() {
  const { user, isLoading } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();
  const updateImageMutation = useUpdateProfileImageMutation();
  const { data: cachedImageUrl } = useCachedProfileImage(
    user?.profile?.profile_image,
  );

  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [initialValues, setInitialValues] = useState({
    bio: "",
  });

  useEffect(() => {
    if (user) {
      const values = {
        bio: user.profile.bio || "",
      };
      setBio(values.bio);
      setProfileImage(user.profile.profile_image || "");
      setInitialValues(values);
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let hasChanges = false;

      if (imageFile) {
        await updateImageMutation.mutateAsync(imageFile);
        hasChanges = true;
      }

      const updates: Record<string, any> = {};

      if (bio !== initialValues.bio) {
        updates.bio = bio;
        hasChanges = true;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfileMutation.mutateAsync(updates);
        hasChanges = true;
      }

      if (!hasChanges) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }

      setInitialValues({
        bio,
      });

      setPreviewUrl(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(initialValues.bio);
    setPreviewUrl(null);
    setImageFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const displayImage =
    previewUrl ||
    cachedImageUrl ||
    profileImage ||
    "/placeholder.svg?height=128&width=128";
  const userInitials =
    `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your profile picture, bio, and model preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="space-y-2">
            <Label>Profile Image</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24 rounded-xl">
                <AvatarImage src={displayImage} alt={user.username} />
                <AvatarFallback className="text-2xl">
                  {userInitials || <UserIcon className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("profile-image")?.click()
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload new image
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* User Info (Read-only) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Username</Label>
              <p className="text-sm font-medium">{user.username}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">First Name</Label>
              <p className="text-sm font-medium">{user.first_name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Last Name</Label>
              <p className="text-sm font-medium">{user.last_name}</p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a little about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Brief description for your profile. Maximum 500 characters.
            </p>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
