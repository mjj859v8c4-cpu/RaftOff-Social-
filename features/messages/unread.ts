import { create } from "zustand";
import { getSupabase } from "@/lib/supabase/client";
import { logger } from "@/lib/logging";

type UnreadState = {
  /** Total unread DMs across every thread — drives the Messages tab badge. */
  total: number;
  /** conversation_id → unread count, so the list can show per-thread dots. */
  byConversation: Record<string, number>;
  refresh: (userId?: string | null) => Promise<void>;
  clearConversation: (conversationId: string) => void;
};

export const useUnreadMessages = create<UnreadState>((set, get) => ({
  total: 0,
  byConversation: {},

  refresh: async (userId) => {
    const sb = getSupabase();
    if (!sb || !userId) {
      set({ total: 0, byConversation: {} });
      return;
    }
    try {
      const { data: memberships, error } = await sb
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("profile_id", userId);
      if (error) throw error;

      const counts = await Promise.all(
        (memberships ?? []).map(async (m) => {
          let query = sb
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", m.conversation_id as string)
            .neq("sender_id", userId);
          if (m.last_read_at) query = query.gt("created_at", m.last_read_at as string);
          const { count } = await query;
          return [m.conversation_id as string, count ?? 0] as const;
        })
      );

      const byConversation: Record<string, number> = {};
      let total = 0;
      for (const [id, count] of counts) {
        byConversation[id] = count;
        total += count;
      }
      set({ total, byConversation });
    } catch (e) {
      logger.warn("messages.unread.refresh", e);
    }
  },

  clearConversation: (conversationId) => {
    const { byConversation, total } = get();
    const had = byConversation[conversationId] ?? 0;
    if (!had) return;
    set({
      total: Math.max(0, total - had),
      byConversation: { ...byConversation, [conversationId]: 0 },
    });
  },
}));
