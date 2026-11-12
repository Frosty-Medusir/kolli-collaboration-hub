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
      matches: {
        Row: {
          content_id: number
          content_title: string
          content_type: string
          created_at: string
          ended_at: string | null
          expires_at: string
          id: string
          kosmi_room_url: string | null
          poster_url: string | null
          release_year: number | null
          room_id: string
          status: string
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
          id?: string
          kosmi_room_url?: string | null
          poster_url?: string | null
          release_year?: number | null
          room_id?: string
          status?: string
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
          id?: string
          kosmi_room_url?: string | null
          poster_url?: string | null
          release_year?: number | null
          room_id?: string
          status?: string
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
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          match_id: string | null
          reason: string
          reported_by: string
          reported_user: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      end_match: { Args: { p_match: string }; Returns: undefined }
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
      match_partner_name: { Args: { p_match: string }; Returns: string }
      queue_status: { Args: never; Returns: Json }
      rate_partner: {
        Args: { p_comment: string; p_match: string; p_stars: number }
        Returns: undefined
      }
      set_kosmi_room: {
        Args: { p_match: string; p_url: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
