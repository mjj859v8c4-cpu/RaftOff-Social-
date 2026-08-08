import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";
import {
  addProfilePhoto,
  deleteMyAccount,
  deleteMyBoat,
  deleteProfilePhoto,
  getFullProfile,
  listIdentityTags,
  listInterests,
  listMyInterests,
  listProfilePhotos,
  reorderProfilePhotos,
  setMyInterests,
  setPrimaryBoat,
  updateMyProfile,
  upsertMyBoat,
  listBoatsForUser,
} from "@/features/profiles/api";
import { listBlockedUsers, unblockUser } from "@/features/moderation/api";
import { pickAndCompressImage, uploadPhoto } from "@/lib/media/upload";
import type { Boat, Interest, Profile, ProfilePhoto } from "@/types/raftoff";
import { PhotoGallery } from "@/components/profile/PhotoGallery";
import { BOATING_BADGES, mergeBadgeSelection, selectableBadgesFrom } from "@/lib/profile/badges";

type BlockedUser = {
  blocked_id: string;
  profiles?: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
};

const VISIBILITY_OPTIONS = [
  ["everyone", "Everyone"],
  ["members", "RaftOff members"],
  ["connections", "Connections only"],
] as const;

const MESSAGE_OPTIONS = [
  ["everyone", "Everyone"],
  ["following", "Followers"],
  ["connections", "Connections only"],
] as const;

export default function EditProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const authProfile = useAuthStore((s) => s.profile);
  const lakes = useRaftOffStore((s) => s.lakes);
  const userId = session?.user?.id;

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [homeMarina, setHomeMarina] = useState("");
  const [homeLakeId, setHomeLakeId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<"avatar" | "cover" | "boat" | null>(null);
  const [identityTags, setIdentityTags] = useState<string[]>([]);
  const [identityCatalog, setIdentityCatalog] = useState<{ id: string; label: string }[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [editingBoat, setEditingBoat] = useState<Boat | "new" | null>(null);
  const [savingBoat, setSavingBoat] = useState(false);
  const [boatName, setBoatName] = useState("");
  const [boatMake, setBoatMake] = useState("");
  const [boatModel, setBoatModel] = useState("");
  const [boatType, setBoatType] = useState("");
  const [boatYear, setBoatYear] = useState("");
  const [boatLength, setBoatLength] = useState("");
  const [boatColor, setBoatColor] = useState("");
  const [boatDescription, setBoatDescription] = useState("");
  const [boatPhotoUrl, setBoatPhotoUrl] = useState<string | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [profileVisibility, setProfileVisibility] = useState<string>("everyone");
  const [messagePrivacy, setMessagePrivacy] = useState<string>("connections");
  const [showOnWater, setShowOnWater] = useState(true);
  const [showMarina, setShowMarina] = useState(true);
  const [showBoat, setShowBoat] = useState(true);
  const [showOnline, setShowOnline] = useState(false);
  const [allowConnectionRequests, setAllowConnectionRequests] = useState(true);
  const [showInDiscovery, setShowInDiscovery] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showMoreAbout, setShowMoreAbout] = useState(false);
  const [showWaterLife, setShowWaterLife] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!userId || !authProfile) return;
    setDisplayName(authProfile.display_name ?? "");
    setUsername(authProfile.username ?? "");
    setBio(authProfile.bio ?? "");
    setHomeCity(authProfile.home_city ?? "");
    setHomeMarina(authProfile.home_marina ?? "");
    const defaultLake =
      authProfile.home_lake_id ??
      lakes.find((l) => l.slug === "lake-st-clair")?.id ??
      lakes[0]?.id ??
      null;
    setHomeLakeId(defaultLake);
    setAvatarUrl(authProfile.avatar_url ?? null);
    setCoverUrl(authProfile.cover_url ?? null);
    setIdentityTags(authProfile.identity_tags ?? []);
    // Open optional sections if they already have content
    if (authProfile.bio || authProfile.home_city || authProfile.cover_url) {
      setShowMoreAbout(true);
    }
    void (async () => {
      try {
        const [tags, ints, mine, myBoats, myPhotos, fullProfile, blocked] = await Promise.all([
          listIdentityTags(),
          listInterests(),
          listMyInterests(userId),
          listBoatsForUser(userId),
          listProfilePhotos(userId).catch(() => [] as ProfilePhoto[]),
          getFullProfile(userId).catch(() => null as Profile | null),
          listBlockedUsers(userId).catch(() => [] as BlockedUser[]),
        ]);
        setIdentityCatalog(tags);
        setInterests(ints);
        setSelectedInterests(mine);
        setBoats(myBoats);
        setPhotos(myPhotos);
        setBlockedUsers(blocked as BlockedUser[]);
        setSelectedBadges(selectableBadgesFrom(fullProfile?.badges ?? authProfile.badges));
        if (myPhotos.length) setShowPhotos(true);
        if (fullProfile) {
          setProfileVisibility(fullProfile.profile_visibility ?? "everyone");
          setMessagePrivacy(fullProfile.message_privacy ?? "connections");
          setShowOnWater(fullProfile.show_on_water ?? true);
          setShowMarina(fullProfile.show_marina ?? true);
          setShowBoat(fullProfile.show_boat ?? true);
          setShowOnline(fullProfile.show_online ?? false);
          setAllowConnectionRequests(fullProfile.allow_connection_requests ?? true);
          setShowInDiscovery(fullProfile.show_in_discovery ?? true);
        }
        if (myBoats.length || mine.length || (authProfile.identity_tags?.length ?? 0) > 0) {
          setShowWaterLife(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoaded(true);
      }
    })();
  }, [userId, authProfile, lakes]);

  const unblock = useCallback(
    async (blockedId: string) => {
      if (!userId) return;
      setUnblockingId(blockedId);
      try {
        await unblockUser(userId, blockedId);
        setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not unblock");
      } finally {
        setUnblockingId(null);
      }
    },
    [userId]
  );

  const confirmDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete account",
      "This removes your photos, hides your profile, and signs you out. This can't be undone from the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingAccount(true);
              setError(null);
              try {
                await deleteMyAccount();
                await signOut();
                router.replace("/(auth)/login" as never);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not delete account");
                setDeletingAccount(false);
              }
            })();
          },
        },
      ]
    );
  }, [signOut]);

  const uploadProfileImage = useCallback(
    async (kind: "avatar" | "cover") => {
      if (!userId) return;
      setUploadingKind(kind);
      setError(null);
      try {
        const picked = await pickAndCompressImage({ allowsEditing: true });
        if (!picked) return;
        const uploaded = await uploadPhoto({
          userId,
          bucket: "profile-photos",
          uri: picked.uri,
          purpose: "profile",
          entityType: kind,
          entityId: userId,
          skipCompress: true,
        });
        const patch =
          kind === "avatar" ? { avatar_url: uploaded.url } : { cover_url: uploaded.url };
        await updateMyProfile(userId, patch);
        if (kind === "avatar") setAvatarUrl(uploaded.url);
        else setCoverUrl(uploaded.url);
        await refreshProfile();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Photo upload failed");
      } finally {
        setUploadingKind(null);
      }
    },
    [userId, refreshProfile]
  );

  const clearBoatForm = useCallback(() => {
    setBoatName("");
    setBoatMake("");
    setBoatModel("");
    setBoatType("");
    setBoatYear("");
    setBoatLength("");
    setBoatColor("");
    setBoatDescription("");
    setBoatPhotoUrl(null);
  }, []);

  const startAddBoat = useCallback(() => {
    clearBoatForm();
    setEditingBoat("new");
  }, [clearBoatForm]);

  const startEditBoat = useCallback((boat: Boat) => {
    setBoatName(boat.name ?? boat.nickname ?? "");
    setBoatMake(boat.manufacturer ?? boat.make ?? "");
    setBoatModel(boat.model ?? "");
    setBoatType(boat.boat_type ?? "");
    setBoatYear(boat.year ? String(boat.year) : "");
    setBoatLength(boat.length_ft ? String(boat.length_ft) : "");
    setBoatColor(boat.primary_color ?? "");
    setBoatDescription(boat.description ?? "");
    setBoatPhotoUrl(boat.photo_url ?? null);
    setEditingBoat(boat);
  }, []);

  const cancelBoatEditor = useCallback(() => {
    setEditingBoat(null);
    clearBoatForm();
  }, [clearBoatForm]);

  const uploadBoatPhoto = useCallback(async () => {
    if (!userId) return;
    setUploadingKind("boat");
    setError(null);
    try {
      const picked = await pickAndCompressImage({ allowsEditing: true });
      if (!picked) return;
      const entityId = editingBoat && editingBoat !== "new" ? editingBoat.id : userId;
      const uploaded = await uploadPhoto({
        userId,
        bucket: "boat-photos",
        uri: picked.uri,
        purpose: "boat",
        entityType: "boat",
        entityId,
        skipCompress: true,
      });
      setBoatPhotoUrl(uploaded.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo upload failed");
    } finally {
      setUploadingKind(null);
    }
  }, [userId, editingBoat]);

  const saveBoatForm = useCallback(async () => {
    if (!userId || !boatName.trim()) return;
    setSavingBoat(true);
    setError(null);
    try {
      const existing = editingBoat && editingBoat !== "new" ? editingBoat : null;
      const saved = await upsertMyBoat({
        id: existing?.id,
        ownerId: userId,
        nickname: boatName.trim(),
        name: boatName.trim(),
        manufacturer: boatMake.trim() || undefined,
        model: boatModel.trim() || undefined,
        boatType: boatType.trim() || undefined,
        year: boatYear.trim() ? parseInt(boatYear, 10) : undefined,
        lengthFt: boatLength.trim() ? parseFloat(boatLength) : undefined,
        primaryColor: boatColor.trim() || undefined,
        description: boatDescription.trim() || undefined,
        photoUrl: boatPhotoUrl ?? undefined,
        isPrimary: existing ? !!existing.is_primary : boats.length === 0,
      });
      setBoats((prev) => {
        const merged = existing
          ? prev.map((b) => (b.id === saved.id ? saved : b))
          : [...prev, saved];
        return saved.is_primary
          ? merged.map((b) => ({ ...b, is_primary: b.id === saved.id }))
          : merged;
      });
      setEditingBoat(null);
      clearBoatForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save boat");
    } finally {
      setSavingBoat(false);
    }
  }, [
    userId,
    editingBoat,
    boatName,
    boatMake,
    boatModel,
    boatType,
    boatYear,
    boatLength,
    boatColor,
    boatDescription,
    boatPhotoUrl,
    boats.length,
    clearBoatForm,
  ]);

  const makeBoatPrimary = useCallback(
    async (boat: Boat) => {
      if (!userId || boat.is_primary) return;
      setError(null);
      const prevBoats = boats;
      setBoats((prev) => prev.map((b) => ({ ...b, is_primary: b.id === boat.id })));
      try {
        await setPrimaryBoat(boat.id, userId);
      } catch (e) {
        setBoats(prevBoats);
        setError(e instanceof Error ? e.message : "Could not set primary boat");
      }
    },
    [userId, boats]
  );

  const removeBoat = useCallback(
    (boat: Boat) => {
      if (!userId) return;
      Alert.alert("Delete boat", `Remove ${boat.name ?? boat.nickname} from your profile?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setError(null);
              try {
                await deleteMyBoat(boat.id, userId);
                setBoats((prev) => prev.filter((b) => b.id !== boat.id));
                if (editingBoat !== "new" && editingBoat?.id === boat.id) {
                  setEditingBoat(null);
                  clearBoatForm();
                }
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not remove boat");
              }
            })();
          },
        },
      ]);
    },
    [userId, editingBoat, clearBoatForm]
  );

  const toggleBadge = useCallback((id: string) => {
    setSelectedBadges((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }, []);

  const addGalleryPhoto = useCallback(async () => {
    if (!userId) return;
    if (photos.length >= 12) {
      setError("Gallery limit is 12 photos");
      return;
    }
    setUploadingPhoto(true);
    setError(null);
    try {
      const picked = await pickAndCompressImage({ allowsEditing: false });
      if (!picked) return;
      const uploaded = await uploadPhoto({
        userId,
        bucket: "profile-photos",
        uri: picked.uri,
        purpose: "profile",
        entityType: "gallery",
        entityId: userId,
        skipCompress: true,
      });
      const photo = await addProfilePhoto(userId, uploaded.url);
      setPhotos((prev) => [...prev, photo]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  }, [userId, photos.length]);

  const deleteGalleryPhoto = useCallback(
    async (photo: ProfilePhoto) => {
      if (!userId) return;
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      try {
        await deleteProfilePhoto(photo.id, userId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete photo");
      }
    },
    [userId]
  );

  const moveGalleryPhoto = useCallback(
    (photo: ProfilePhoto, direction: "left" | "right") => {
      if (!userId) return;
      setPhotos((prev) => {
        const idx = prev.findIndex((p) => p.id === photo.id);
        const swapWith = direction === "left" ? idx - 1 : idx + 1;
        if (idx === -1 || swapWith < 0 || swapWith >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
        void reorderProfilePhotos(
          userId,
          next.map((p) => p.id)
        ).catch((e) => setError(e instanceof Error ? e.message : "Could not reorder photos"));
        return next;
      });
    },
    [userId]
  );

  const toggleTag = (id: string) => {
    setIdentityTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id].slice(0, 8)
    );
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id].slice(0, 16)
    );
  };

  const save = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile(userId, {
        display_name: displayName.trim() || "Boater",
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        home_city: homeCity.trim() || null,
        home_marina: homeMarina.trim() || null,
        home_lake_id: homeLakeId,
        identity_tags: identityTags,
        onboarding_completed: true,
        profile_visibility: profileVisibility,
        message_privacy: messagePrivacy,
        show_on_water: showOnWater,
        show_marina: showMarina,
        show_boat: showBoat,
        show_online: showOnline,
        allow_connection_requests: allowConnectionRequests,
        show_in_discovery: showInDiscovery,
        badges: mergeBadgeSelection(authProfile?.badges, selectedBadges),
      });
      await setMyInterests(userId, selectedInterests);
      await refreshProfile();
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
        setError("That username is taken — try another.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [
    userId,
    displayName,
    username,
    bio,
    homeCity,
    homeMarina,
    homeLakeId,
    identityTags,
    selectedInterests,
    selectedBadges,
    authProfile?.badges,
    avatarUrl,
    coverUrl,
    profileVisibility,
    messagePrivacy,
    showOnWater,
    showMarina,
    showBoat,
    showOnline,
    allowConnectionRequests,
    showInDiscovery,
    refreshProfile,
  ]);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.wrap}>
        <ActivityIndicator color={colors.action} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <Pressable onPress={() => void save()} disabled={saving} hitSlop={12}>
          <Text style={[styles.link, styles.save]}>{saving ? "…" : "Save"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.section}>Essentials</Text>
        <Text style={styles.sectionSub}>Name, handle, and home lake — everything else is optional.</Text>

        <View style={styles.avatarRow}>
          <Pressable
            style={styles.avatarTap}
            onPress={() => void uploadProfileImage("avatar")}
            disabled={!!uploadingKind}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarEmpty}>
                <Text style={styles.avatarEmptyText}>
                  {(displayName || "?").slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
          <View style={{ flex: 1, gap: 8 }}>
            <Pressable
              style={styles.photoBtn}
              onPress={() => void uploadProfileImage("avatar")}
              disabled={!!uploadingKind}
            >
              <Text style={styles.photoBtnText}>
                {uploadingKind === "avatar" ? "Uploading…" : "Add photo (optional)"}
              </Text>
            </Pressable>
            <Text style={styles.photoNote}>Skip anytime — you can explore without one.</Text>
          </View>
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={username}
          onChangeText={(t) =>
            setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30))
          }
          placeholder="coreyonthewater"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Home lake</Text>
        <View style={styles.wrapChips}>
          {lakes.map((l) => {
            const on = homeLakeId === l.id;
            return (
              <Pressable
                key={l.id}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => setHomeLakeId(l.id)}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{l.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.disclose} onPress={() => setShowMoreAbout((v) => !v)}>
          <Text style={styles.discloseText}>
            {showMoreAbout ? "Hide" : "Add"} bio & location{" "}
            <Text style={styles.optional}>optional</Text>
          </Text>
          <Text style={styles.discloseChevron}>{showMoreAbout ? "▴" : "▾"}</Text>
        </Pressable>
        {showMoreAbout ? (
          <View style={styles.discloseBody}>
            <Text style={styles.label}>
              Cover photo <Text style={styles.optional}>optional</Text>
            </Text>
            <Pressable
              style={styles.coverTap}
              onPress={() => void uploadProfileImage("cover")}
              disabled={!!uploadingKind}
            >
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.coverImg} />
              ) : (
                <View style={styles.coverEmpty}>
                  <Text style={styles.photoHint}>
                    {uploadingKind === "cover" ? "Uploading cover…" : "Tap to add cover"}
                  </Text>
                </View>
              )}
            </Pressable>
            <Text style={styles.label}>
              Bio <Text style={styles.optional}>optional</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.bio]}
              multiline
              value={bio}
              onChangeText={setBio}
              placeholder="Usually somewhere between Strawberry Island and Muscamoot."
              placeholderTextColor={colors.muted}
              maxLength={240}
            />
            <Text style={styles.label}>
              Home city / area <Text style={styles.optional}>optional</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={homeCity}
              onChangeText={setHomeCity}
              placeholder="St. Clair Shores, MI"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>
              Home marina <Text style={styles.optional}>optional</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={homeMarina}
              onChangeText={setHomeMarina}
              placeholder="Belle Maer Harbor"
              placeholderTextColor={colors.muted}
            />
          </View>
        ) : null}

        <Pressable style={styles.disclose} onPress={() => setShowPhotos((v) => !v)}>
          <Text style={styles.discloseText}>
            {showPhotos ? "Hide" : "Add"} photo gallery{" "}
            <Text style={styles.optional}>optional</Text>
          </Text>
          <Text style={styles.discloseChevron}>{showPhotos ? "▴" : "▾"}</Text>
        </Pressable>
        {showPhotos ? (
          <View style={styles.discloseBody}>
            <Text style={styles.label}>Gallery</Text>
            <PhotoGallery
              photos={photos}
              editable
              uploading={uploadingPhoto}
              onAddPhoto={() => void addGalleryPhoto()}
              onDeletePhoto={(p) => void deleteGalleryPhoto(p)}
              onMovePhoto={moveGalleryPhoto}
            />
          </View>
        ) : null}

        <Pressable style={styles.disclose} onPress={() => setShowWaterLife((v) => !v)}>
          <Text style={styles.discloseText}>
            {showWaterLife ? "Hide" : "Add"} interests, boats & badges{" "}
            <Text style={styles.optional}>optional</Text>
          </Text>
          <Text style={styles.discloseChevron}>{showWaterLife ? "▴" : "▾"}</Text>
        </Pressable>
        {showWaterLife ? (
          <View style={styles.discloseBody}>
            <Text style={styles.label}>My water life</Text>
            <View style={styles.wrapChips}>
              {identityCatalog.map((t) => {
                const on = identityTags.includes(t.id);
                return (
                  <Pressable
                    key={t.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => toggleTag(t.id)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Interests</Text>
            <View style={styles.wrapChips}>
              {interests.map((i) => {
                const on = selectedInterests.includes(i.id);
                return (
                  <Pressable
                    key={i.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => toggleInterest(i.id)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{i.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.boatHeaderRow}>
              <Text style={styles.label}>My boats</Text>
              {editingBoat === null ? (
                <Pressable onPress={startAddBoat} hitSlop={8}>
                  <Text style={styles.addBoatLink}>+ Add boat</Text>
                </Pressable>
              ) : null}
            </View>

            {boats.length === 0 && editingBoat === null ? (
              <Text style={styles.emptyHint}>
                No boats yet — add one so lake friends know what you're rocking.
              </Text>
            ) : null}

            {boats.map((b) => (
              <View key={b.id} style={styles.boatRow}>
                {b.photo_url ? (
                  <Image source={{ uri: b.photo_url }} style={styles.boatRowImg} />
                ) : (
                  <View style={styles.boatRowImgEmpty}>
                    <Text style={styles.photoHint}>🚤</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.boatRowNameLine}>
                    <Text style={styles.boatRowName} numberOfLines={1}>
                      {b.name || b.nickname}
                    </Text>
                    {b.is_primary ? <Text style={styles.primaryTag}>PRIMARY</Text> : null}
                  </View>
                  <Text style={styles.boatRowSub} numberOfLines={1}>
                    {[b.manufacturer ?? b.make, b.model, b.boat_type].filter(Boolean).join(" · ") ||
                      "No details yet"}
                  </Text>
                  <View style={styles.boatRowActions}>
                    {!b.is_primary ? (
                      <Pressable onPress={() => void makeBoatPrimary(b)} hitSlop={6}>
                        <Text style={styles.boatRowAction}>Set primary</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => startEditBoat(b)} hitSlop={6}>
                      <Text style={styles.boatRowAction}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => removeBoat(b)} hitSlop={6}>
                      <Text style={[styles.boatRowAction, styles.removeBoat]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {editingBoat !== null ? (
              <View style={styles.boatEditor}>
                <View style={styles.boatPhotoRow}>
                  <Pressable
                    style={styles.boatPhotoTap}
                    onPress={() => void uploadBoatPhoto()}
                    disabled={!!uploadingKind}
                  >
                    {boatPhotoUrl ? (
                      <Image source={{ uri: boatPhotoUrl }} style={styles.boatPhotoImg} />
                    ) : (
                      <View style={styles.boatPhotoEmpty}>
                        <Text style={styles.photoHint}>
                          {uploadingKind === "boat" ? "…" : "🚤 Add photo"}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  <View style={{ flex: 1, gap: 6 }}>
                    <TextInput
                      style={styles.input}
                      value={boatName}
                      onChangeText={setBoatName}
                      placeholder="Boat name / nickname"
                      placeholderTextColor={colors.muted}
                    />
                    <TextInput
                      style={styles.input}
                      value={boatMake}
                      onChangeText={setBoatMake}
                      placeholder="Manufacturer"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  value={boatModel}
                  onChangeText={setBoatModel}
                  placeholder="Model"
                  placeholderTextColor={colors.muted}
                />
                <TextInput
                  style={styles.input}
                  value={boatType}
                  onChangeText={setBoatType}
                  placeholder="Bowrider / Cruiser / Pontoon…"
                  placeholderTextColor={colors.muted}
                />
                <View style={styles.boatRow3}>
                  <TextInput
                    style={[styles.input, styles.boatRow3Item]}
                    value={boatYear}
                    onChangeText={(t) => setBoatYear(t.replace(/[^0-9]/g, "").slice(0, 4))}
                    placeholder="Year"
                    keyboardType="number-pad"
                    placeholderTextColor={colors.muted}
                  />
                  <TextInput
                    style={[styles.input, styles.boatRow3Item]}
                    value={boatLength}
                    onChangeText={(t) => setBoatLength(t.replace(/[^0-9.]/g, "").slice(0, 5))}
                    placeholder="Length (ft)"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.muted}
                  />
                  <TextInput
                    style={[styles.input, styles.boatRow3Item]}
                    value={boatColor}
                    onChangeText={setBoatColor}
                    placeholder="Color"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <TextInput
                  style={[styles.input, styles.boatDescription]}
                  value={boatDescription}
                  onChangeText={setBoatDescription}
                  placeholder="A line or two about your boat (optional)"
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={200}
                />
                <View style={styles.boatEditorActions}>
                  <Pressable style={styles.boatEditorCancel} onPress={cancelBoatEditor}>
                    <Text style={styles.boatEditorCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.boatEditorSave, !boatName.trim() && styles.boatEditorSaveDisabled]}
                    onPress={() => void saveBoatForm()}
                    disabled={savingBoat || !boatName.trim()}
                  >
                    <Text style={styles.boatEditorSaveText}>
                      {savingBoat ? "Saving…" : editingBoat === "new" ? "Add boat" : "Save boat"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Text style={[styles.label, { marginTop: 18 }]}>Boating badges</Text>
            <Text style={styles.sectionSub}>
              Pick what fits — shown on your profile next to any earned badges.
            </Text>
            <View style={styles.wrapChips}>
              {BOATING_BADGES.map((b) => {
                const on = selectedBadges.includes(b.id);
                return (
                  <Pressable
                    key={b.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => toggleBadge(b.id)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      {b.emoji} {b.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <Pressable style={styles.disclose} onPress={() => setShowPrivacy((v) => !v)}>
          <Text style={styles.discloseText}>
            {showPrivacy ? "Hide" : "Adjust"} privacy{" "}
            <Text style={styles.optional}>optional</Text>
          </Text>
          <Text style={styles.discloseChevron}>{showPrivacy ? "▴" : "▾"}</Text>
        </Pressable>
        {showPrivacy ? (
          <View style={styles.discloseBody}>
            <Text style={styles.label}>Who can see my profile</Text>
            <View style={styles.wrapChips}>
              {VISIBILITY_OPTIONS.map(([id, label]) => (
                <Pressable
                  key={id}
                  style={[styles.chip, profileVisibility === id && styles.chipOn]}
                  onPress={() => setProfileVisibility(id)}
                >
                  <Text
                    style={[styles.chipText, profileVisibility === id && styles.chipTextOn]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Who can message me</Text>
            <View style={styles.wrapChips}>
              {MESSAGE_OPTIONS.map(([id, label]) => (
                <Pressable
                  key={id}
                  style={[styles.chip, messagePrivacy === id && styles.chipOn]}
                  onPress={() => setMessagePrivacy(id)}
                >
                  <Text style={[styles.chipText, messagePrivacy === id && styles.chipTextOn]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <SwitchRow
              label="Allow connection requests"
              value={allowConnectionRequests}
              onValueChange={setAllowConnectionRequests}
            />
            <SwitchRow
              label="Show when I'm checked in on the water"
              value={showOnWater}
              onValueChange={setShowOnWater}
            />
            <SwitchRow label="Show my home marina" value={showMarina} onValueChange={setShowMarina} />
            <SwitchRow label="Show my boat" value={showBoat} onValueChange={setShowBoat} />
            <SwitchRow label="Show when I'm online" value={showOnline} onValueChange={setShowOnline} />
            <SwitchRow
              label="Show me in Discovery & search"
              value={showInDiscovery}
              onValueChange={setShowInDiscovery}
            />
          </View>
        ) : null}

        <Text style={styles.hint}>
          Never share registration numbers or exact dock slips. Profiles are for connecting on the
          water — not doxxing boats.
        </Text>

        <Pressable style={styles.primary} onPress={() => void save()} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? "Saving…" : "Save profile"}</Text>
        </Pressable>

        <Pressable style={styles.disclose} onPress={() => setShowAccount((v) => !v)}>
          <Text style={styles.discloseText}>{showAccount ? "Hide" : "Manage"} account</Text>
          <Text style={styles.discloseChevron}>{showAccount ? "▴" : "▾"}</Text>
        </Pressable>
        {showAccount ? (
          <View style={styles.discloseBody}>
            <Text style={styles.label}>Blocked users</Text>
            {blockedUsers.length === 0 ? (
              <Text style={styles.hint}>You haven't blocked anyone.</Text>
            ) : (
              blockedUsers.map((b) => (
                <View key={b.blocked_id} style={styles.blockedRow}>
                  {b.profiles?.avatar_url ? (
                    <Image source={{ uri: b.profiles.avatar_url }} style={styles.blockedAvatar} />
                  ) : (
                    <View style={[styles.blockedAvatar, styles.blockedAvatarEmpty]}>
                      <Text style={styles.avatarEmptyText}>
                        {(b.profiles?.display_name ?? "?").slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.blockedName} numberOfLines={1}>
                    {b.profiles?.display_name ?? "RaftOff member"}
                  </Text>
                  <Pressable
                    onPress={() => void unblock(b.blocked_id)}
                    disabled={unblockingId === b.blocked_id}
                    hitSlop={8}
                  >
                    <Text style={styles.unblockText}>
                      {unblockingId === b.blocked_id ? "…" : "Unblock"}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}

            <Pressable
              style={[styles.ghostBtn, { marginTop: 16 }]}
              onPress={() => void signOut().then(() => router.replace("/(auth)/login" as never))}
            >
              <Text style={styles.ghostBtnText}>Sign out</Text>
            </Pressable>

            <Pressable
              style={[styles.dangerBtn, { marginTop: 10 }]}
              disabled={deletingAccount}
              onPress={confirmDeleteAccount}
            >
              <Text style={styles.dangerBtnText}>
                {deletingAccount ? "Deleting…" : "Delete account"}
              </Text>
            </Pressable>
            <Text style={styles.hint}>
              Deleting your account hides your profile, clears your photos and status, and signs
              you out.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.action }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { color: colors.text, fontWeight: "800", fontSize: 16 },
  link: { color: colors.muted, fontWeight: "600" },
  save: { color: colors.action },
  content: { padding: spacing.lg, paddingBottom: 48, gap: 6 },
  section: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15,
    marginTop: 8,
    marginBottom: 2,
  },
  sectionSub: { color: colors.muted, fontSize: 12, marginBottom: 8, lineHeight: 17 },
  optional: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  disclose: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(18,32,51,0.6)",
  },
  discloseText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  discloseChevron: { color: colors.muted, fontSize: 14 },
  discloseBody: { marginTop: 4, gap: 2 },
  coverTap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 4,
  },
  coverImg: { width: "100%", height: 120 },
  coverEmpty: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(46,242,200,0.08)",
  },
  photoHint: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8 },
  avatarTap: { borderRadius: 40 },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.action,
    backgroundColor: colors.bgElevated,
  },
  avatarEmpty: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmptyText: { color: "#fff", fontWeight: "800", fontSize: 22 },
  photoBtn: {
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  photoBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  photoNote: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: "rgba(18,32,51,0.9)",
    marginTop: 4,
  },
  bio: { minHeight: 88, textAlignVertical: "top" },
  wrapChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(18,32,51,0.8)",
  },
  chipOn: { borderColor: colors.action, backgroundColor: "rgba(255,61,130,0.15)" },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextOn: { color: colors.text },
  hint: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 17 },
  error: { color: "#ff8fa8", marginBottom: 8 },
  primary: {
    marginTop: 22,
    backgroundColor: colors.action,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  boatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  removeBoat: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  boatPhotoRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  boatPhotoTap: { borderRadius: 12 },
  boatPhotoImg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  boatPhotoEmpty: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,159,67,0.1)",
    borderWidth: 1,
    borderColor: colors.line,
  },
  boatRow3: { flexDirection: "row", gap: 8 },
  boatRow3Item: { flex: 1 },
  boatDescription: { minHeight: 56, textAlignVertical: "top" },
  addBoatLink: { color: colors.action, fontSize: 12, fontWeight: "800" },
  emptyHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  boatRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "rgba(18,32,51,0.6)",
  },
  boatRowImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  boatRowImgEmpty: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,159,67,0.1)",
    borderWidth: 1,
    borderColor: colors.line,
  },
  boatRowNameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  boatRowName: { color: colors.text, fontWeight: "800", fontSize: 14, flexShrink: 1 },
  primaryTag: {
    color: colors.action,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  boatRowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  boatRowActions: { flexDirection: "row", gap: 14, marginTop: 6 },
  boatRowAction: { color: colors.action, fontSize: 12, fontWeight: "700" },
  boatEditor: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "rgba(18,32,51,0.4)",
    gap: 2,
  },
  boatEditorActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  boatEditorCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  boatEditorCancelText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  boatEditorSave: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.action,
  },
  boatEditorSaveDisabled: { opacity: 0.5 },
  boatEditorSaveText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  switchLabel: { color: colors.text, fontSize: 13, fontWeight: "600", flex: 1, marginRight: 10 },
  blockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  blockedAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgElevated },
  blockedAvatarEmpty: { alignItems: "center", justifyContent: "center", backgroundColor: colors.action },
  blockedName: { color: colors.text, fontWeight: "700", fontSize: 13, flex: 1 },
  unblockText: { color: colors.action, fontWeight: "700", fontSize: 12 },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ghostBtnText: { color: colors.text, fontWeight: "700" },
  dangerBtn: {
    backgroundColor: "rgba(255,92,92,0.12)",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerBtnText: { color: colors.danger, fontWeight: "800" },
});
