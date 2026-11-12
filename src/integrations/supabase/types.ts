export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      device_tokens: {
        Row: {
          created_at: string
          flagged: boolean
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flagged?: boolean
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          flagged?: boolean
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      endorsements: {
        Row: {
          badge: string
          created_at: string
          from_user: string
          match_id: string
          to_user: string
        }
        Insert: {
          badge: string
          created_at?: string
          from_user: string
          match_id: string
          to_user: string
        }
        Update: {
          badge?: string
          created_at?: string
          from_user?: string
          match_id?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "endorsements_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_session_log: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          session_id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      live_events: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string
          ends_at: string
          id: number
          poster_url: string | null
          starts_at: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string
          description?: string
          ends_at: string
          id?: never
          poster_url?: string | null
          starts_at: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          ends_at?: string
          id?: never
          poster_url?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          content_id: number
          content_title: string
          content_type: string
          created_at: string
          ended_at: string | null
          expires_at: string
          icebreaker: string | null
          id: string
          kosmi_room_url: string | null
          poster_url: string | null
          release_year: number | null
          room_id: string
          status: string
          teleparty_url: string | null
          user1: string
          user2: string
        }
        Insert: {
          content_id: number
          content_title: string
          content_type?: string
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          icebreaker?: string | null
          id?: string
          kosmi_room_url?: string | null
          poster_url?: string | null
          release_year?: number | null
          room_id?: string
          status?: string
          teleparty_url?: string | null
          user1: string
          user2: string
        }
        Update: {
          content_id?: number
          content_title?: string
          content_type?: string
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          icebreaker?: string | null
          id?: string
          kosmi_room_url?: string | null
          poster_url?: string | null
          release_year?: number | null
          room_id?: string
          status?: string
          teleparty_url?: string | null
          user1?: string
          user2?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
          sender_name: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_bans: {
        Row: {
          banned_at: string
          banned_by: string
          reason: string
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          reason: string
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          match_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          match_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          match_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          adult_confirmed_at: string
          average_rating: number
          bad_ratings: number
          created_at: string
          id: string
          matches_completed: number
          privacy_notice_version: string
          shadow_banned_until: string | null
          total_ratings_received: number
          username: string
        }
        Insert: {
          adult_confirmed_at?: string
          average_rating?: number
          bad_ratings?: number
          created_at?: string
          id: string
          matches_completed?: number
          privacy_notice_version?: string
          shadow_banned_until?: string | null
          total_ratings_received?: number
          username: string
        }
        Update: {
          adult_confirmed_at?: string
          average_rating?: number
          bad_ratings?: number
          created_at?: string
          id?: string
          matches_completed?: number
          privacy_notice_version?: string
          shadow_banned_until?: string | null
          total_ratings_received?: number
          username?: string
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          content_id: number
          content_title: string
          content_type: string
          id: string
          joined_at: string
          matched_with: string | null
          poster_url: string | null
          release_year: number | null
          status: string
          user_id: string
          vibes: string[]
        }
        Insert: {
          content_id: number
          content_title: string
          content_type?: string
          id?: string
          joined_at?: string
          matched_with?: string | null
          poster_url?: string | null
          release_year?: number | null
          status?: string
          user_id: string
          vibes?: string[]
        }
        Update: {
          content_id?: number
          content_title?: string
          content_type?: string
          id?: string
          joined_at?: string
          matched_with?: string | null
          poster_url?: string | null
          release_year?: number | null
          status?: string
          user_id?: string
          vibes?: string[]
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          from_user: string
          id: string
          match_id: string
          stars: number
          to_user: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_user: string
          id?: string
          match_id: string
          stars: number
          to_user: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_user?: string
          id?: string
          match_id?: string
          stars?: number
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_settings: {
        Row: {
          hide_disliked_genres: boolean
          id: number
          popularity_weight: number
          quality_weight: number
          taste_weight: number
          updated_at: string
        }
        Insert: {
          hide_disliked_genres?: boolean
          id?: number
          popularity_weight?: number
          quality_weight?: number
          taste_weight?: number
          updated_at?: string
        }
        Update: {
          hide_disliked_genres?: boolean
          id?: number
          popularity_weight?: number
          quality_weight?: number
          taste_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          match_id: string | null
          reason: string
          reported_by: string
          reported_user: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string | null
          reason: string
          reported_by: string
          reported_user: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string | null
          reason?: string
          reported_by?: string
          reported_user?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_flags: {
        Row: {
          created_at: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      title_ratings: {
        Row: {
          content_id: number
          content_title: string
          content_type: string
          genre_ids: number[]
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: number
          content_title: string
          content_type: string
          genre_ids?: number[]
          stars: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: number
          content_title?: string
          content_type?: string
          genre_ids?: number[]
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watch_requests: {
        Row: {
          content_id: number
          content_title: string
          content_type: string
          created_at: string
          expires_at: string
          id: string
          match_id: string | null
          poster_url: string | null
          release_year: number | null
          status: string
          user_id: string
          vibes: string[]
        }
        Insert: {
          content_id: number
          content_title: string
          content_type: string
          created_at?: string
          expires_at?: string
          id?: string
          match_id?: string | null
          poster_url?: string | null
          release_year?: number | null
          status?: string
          user_id: string
          vibes?: string[]
        }
        Update: {
          content_id?: number
          content_title?: string
          content_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          match_id?: string | null
          poster_url?: string | null
          release_year?: number | null
          status?: string
          user_id?: string
          vibes?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_moderation_dashboard: { Args: never; Returns: Json }
      admin_resolve_report: { Args: { p_report: string }; Returns: undefined }
      admin_set_user_ban: {
        Args: { p_banned: boolean; p_reason: string; p_user: string }
        Returns: undefined
      }
      badge_counts: { Args: { p_user: string }; Returns: Json }
      cancel_watch_request: { Args: { p_request: string }; Returns: undefined }
      chat_content_violation: { Args: { p_body: string }; Returns: string }
      clean_vibes: { Args: { p: string[] }; Returns: string[] }
      end_match: { Args: { p_match: string }; Returns: undefined }
      endorse_partner: {
        Args: { p_badges: string[]; p_match: string }
        Returns: number
      }
      endorsement_total: { Args: { p_user: string }; Returns: number }
      find_match: {
        Args: {
          p_content_id: number
          p_poster: string
          p_title: string
          p_type: string
          p_vibes: string[]
          p_year: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_queue: {
        Args: {
          p_content_id: number
          p_poster: string
          p_title: string
          p_type: string
          p_year: number
        }
        Returns: Json
      }
      leave_queue: { Args: never; Returns: undefined }
      mark_notifications_read: { Args: never; Returns: undefined }
      match_partner_badges: { Args: { p_match: string }; Returns: Json }
      match_partner_name: { Args: { p_match: string }; Returns: string }
      matching_guard: { Args: { me: string }; Returns: boolean }
      my_badges: { Args: never; Returns: Json }
      notify_user: {
        Args: {
          p_body: string
          p_match: string
          p_title: string
          p_user: string
        }
        Returns: undefined
      }
      queue_for_later: {
        Args: {
          p_content_id: number
          p_poster: string
          p_title: string
          p_type: string
          p_vibes: string[]
          p_year: number
        }
        Returns: Json
      }
      queue_status: { Args: never; Returns: Json }
      rate_partner: {
        Args: { p_comment: string; p_match: string; p_stars: number }
        Returns: undefined
      }
      report_conduct: {
        Args: { p_description: string; p_match: string; p_reason: string }
        Returns: string
      }
      resolve_content: {
        Args: {
          p_content_id: number
          p_poster: string
          p_title: string
          p_type: string
          p_year: number
        }
        Returns: Record<string, unknown>
      }
      set_kosmi_room: {
        Args: { p_match: string; p_url: string }
        Returns: string
      }
      set_teleparty_link: {
        Args: { p_match: string; p_url: string }
        Returns: string
      }
      vibes_compatible: { Args: { a: string[]; b: string[] }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
