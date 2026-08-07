import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
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
  listIdentityTags,
  listInterests,
  listMyInterests,
  setMyInterests,
  updateMyProfile,
  upsertMyBoat,
  listBoatsForUser,
} from "@/features/profiles/api";
import { pickAndCompressImage, uploadPhoto } from "@/lib/media/upload";
import type { Boat, Interest } from "@/types/raftoff";

export default function EditProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
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
  const [uploadingKind, setUploadingKind] = useState<"avatar" | "cover" | null>(null);
  const [identityTags, setIdentityTags] = useState<string[]>([]);
  const [identityCatalog, setIdentityCatalog] = useState<{ id: string; label: string }[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [boatName, setBoatName] = useState("");
  const [boatMake, setBoatMake] = useState("");
  const [boatModel, setBoatModel] = useState("");
  const [boatType, setBoatType] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId || !authProfile) return;
    setDisplayName(authProfile.display_name ?? "");
    setUsername(authProfile.username ?? "");
    setBio(authProfile.bio ?? "");
    setHomeCity(authProfile.home_city ?? "");
    setHomeMarina(authProfile.home_marina ?? "");
    setHomeLakeId(authProfile.home_lake_id);
    setAvatarUrl(authProfile.avatar_url ?? null);
    setCoverUrl(authProfile.cover_url ?? null);
    setIdentityTags(authProfile.identity_tags ?? []);
    void (async () => {
      try {
        const [tags, ints, mine, myBoats] = await Promise.all([
          listIdentityTags(),
          listInterests(),
          listMyInterests(userId),
          listBoatsForUser(userId),
        ]);
        setIdentityCatalog(tags);
        setInterests(ints);
        setSelectedInterests(mine);
        setBoats(myBoats);
        const primary = myBoats.find((b) => b.is_primary) ?? myBoats[0];
        if (primary) {
          setBoatName(primary.name ?? primary.nickname ?? "");
          setBoatMake(primary.manufacturer ?? primary.make ?? "");
          setBoatModel(primary.model ?? "");
          setBoatType(primary.boat_type ?? "");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoaded(true);
      }
    })();
  }, [userId, authProfile]);

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
      });
      await setMyInterests(userId, selectedInterests);
      if (boatName.trim()) {
        const existing = boats.find((b) => b.is_primary) ?? boats[0];
        await upsertMyBoat({
          id: existing?.id,
          ownerId: userId,
          nickname: boatName.trim(),
          name: boatName.trim(),
          manufacturer: boatMake.trim() || undefined,
          model: boatModel.trim() || undefined,
          boatType: boatType.trim() || undefined,
          homeMarina: homeMarina.trim() || undefined,
          isPrimary: true,
        });
      }
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
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
    boatName,
    boatMake,
    boatModel,
    boatType,
    boats,
    avatarUrl,
    coverUrl,
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

        <Text style={styles.section}>Photos</Text>
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
                {uploadingKind === "cover" ? "Uploading cover…" : "Tap to add cover photo"}
              </Text>
            </View>
          )}
        </Pressable>
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
                {uploadingKind === "avatar" ? "Uploading…" : "Change profile photo"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.photoBtnGhost}
              onPress={() => void uploadProfileImage("cover")}
              disabled={!!uploadingKind}
            >
              <Text style={styles.photoBtnGhostText}>
                {uploadingKind === "cover" ? "Uploading…" : "Change cover"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.section}>Profile</Text>
        <Text style={styles.label}>Display name</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          placeholder="coreyonthewater"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bio]}
          multiline
          value={bio}
          onChangeText={setBio}
          placeholder="Usually somewhere between Strawberry Island and Muscamoot."
          placeholderTextColor={colors.muted}
          maxLength={240}
        />
        <Text style={styles.label}>Home city / area</Text>
        <TextInput
          style={styles.input}
          value={homeCity}
          onChangeText={setHomeCity}
          placeholder="St. Clair Shores, MI"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>Home marina (optional)</Text>
        <TextInput
          style={styles.input}
          value={homeMarina}
          onChangeText={setHomeMarina}
          placeholder="Belle Maer Harbor"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.section}>Home lake</Text>
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

        <Text style={styles.section}>My water life</Text>
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

        <Text style={styles.section}>Interests</Text>
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

        <Text style={styles.section}>Primary boat (optional)</Text>
        <Text style={styles.label}>Boat name / nickname</Text>
        <TextInput
          style={styles.input}
          value={boatName}
          onChangeText={setBoatName}
          placeholder="Lake Therapy"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>Manufacturer</Text>
        <TextInput
          style={styles.input}
          value={boatMake}
          onChangeText={setBoatMake}
          placeholder="Sea Ray"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={boatModel}
          onChangeText={setBoatModel}
          placeholder="250 SLX"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>Type</Text>
        <TextInput
          style={styles.input}
          value={boatType}
          onChangeText={setBoatType}
          placeholder="Bowrider / Cruiser / Pontoon…"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.hint}>
          Never share registration numbers or exact dock slips. Profiles are for connecting on the
          water — not doxxing boats.
        </Text>

        <Pressable style={styles.primary} onPress={() => void save()} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? "Saving…" : "Save profile"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
    marginTop: 18,
    marginBottom: 6,
  },
  coverTap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 4,
  },
  coverImg: { width: "100%", height: 120 },
  coverEmpty: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(46,242,200,0.08)",
  },
  photoHint: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12 },
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
  photoBtnGhost: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  photoBtnGhostText: { color: colors.text, fontWeight: "700", fontSize: 13 },
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
});
