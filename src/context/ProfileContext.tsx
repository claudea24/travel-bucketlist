"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { UserProfile } from "@/lib/types";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { profileFromRow } from "@/lib/mappers/profile";

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback(
    () => session?.getToken({ template: "supabase" }) ?? Promise.resolve(null),
    [session]
  );
  const clientRef = useRef(createClerkSupabaseClient(getToken));
  useEffect(() => { clientRef.current = createClerkSupabaseClient(getToken); }, [getToken]);

  useEffect(() => {
    if (!session || !user) { setIsLoading(false); return; }

    let cancelled = false;

    async function fetchOrCreateProfile() {
      setIsLoading(true);
      const client = clientRef.current;
      const userId = user!.id;

      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setProfile(profileFromRow(data as Record<string, unknown>));
      } else if (!error || error.code === "PGRST116") {
        // Profile doesn't exist, create one
        const newProfile = {
          user_id: userId,
          display_name: user!.fullName || user!.firstName || "Traveler",
          avatar_url: user!.imageUrl || null,
          bio: "",
          is_public: true,
        };
        const { data: created, error: createErr } = await client
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (!cancelled && created && !createErr) {
          setProfile(profileFromRow(created as Record<string, unknown>));
        }
      }
      if (!cancelled) setIsLoading(false);
    }

    fetchOrCreateProfile();
    return () => { cancelled = true; };
  }, [session, user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile || !user) return;
    const client = clientRef.current;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;

    setProfile((prev) => prev ? { ...prev, ...updates } : prev);
    const { error } = await client.from("profiles").update(dbUpdates).eq("user_id", user.id);
    if (error) console.error("Failed to update profile:", error);
  }, [profile, user]);

  const value = useMemo(() => ({ profile, isLoading, updateProfile }), [profile, isLoading, updateProfile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
