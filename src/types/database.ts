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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      game_alliances: {
        Row: {
          betrayed_by_tribute_id: string | null
          created_at: string
          dissolved_phase_id: string | null
          formed_phase_id: string | null
          game_id: string
          id: string
          status: string
          tribute_ids: string[]
        }
        Insert: {
          betrayed_by_tribute_id?: string | null
          created_at?: string
          dissolved_phase_id?: string | null
          formed_phase_id?: string | null
          game_id: string
          id?: string
          status?: string
          tribute_ids: string[]
        }
        Update: {
          betrayed_by_tribute_id?: string | null
          created_at?: string
          dissolved_phase_id?: string | null
          formed_phase_id?: string | null
          game_id?: string
          id?: string
          status?: string
          tribute_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "game_alliances_betrayed_by_tribute_id_fkey"
            columns: ["betrayed_by_tribute_id"]
            isOneToOne: false
            referencedRelation: "tributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_alliances_dissolved_phase_id_fkey"
            columns: ["dissolved_phase_id"]
            isOneToOne: false
            referencedRelation: "game_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_alliances_formed_phase_id_fkey"
            columns: ["formed_phase_id"]
            isOneToOne: false
            referencedRelation: "game_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_alliances_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_phase_events: {
        Row: {
          created_at: string
          event_category: string
          event_order: number
          game_id: string
          id: string
          killer_ids: string[] | null
          narrative_text: string
          outcome_type: string
          phase_id: string
          state_delta: Json
          tribute_ids: string[]
          victim_ids: string[] | null
        }
        Insert: {
          created_at?: string
          event_category: string
          event_order: number
          game_id: string
          id?: string
          killer_ids?: string[] | null
          narrative_text?: string
          outcome_type: string
          phase_id: string
          state_delta?: Json
          tribute_ids?: string[]
          victim_ids?: string[] | null
        }
        Update: {
          created_at?: string
          event_category?: string
          event_order?: number
          game_id?: string
          id?: string
          killer_ids?: string[] | null
          narrative_text?: string
          outcome_type?: string
          phase_id?: string
          state_delta?: Json
          tribute_ids?: string[]
          victim_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "game_phase_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_phase_events_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "game_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      game_phases: {
        Row: {
          created_at: string
          day_number: number
          fallen_tribute_ids: string[]
          game_id: string
          id: string
          phase_order: number
          phase_type: string
          status: string
        }
        Insert: {
          created_at?: string
          day_number?: number
          fallen_tribute_ids?: string[]
          game_id: string
          id?: string
          phase_order: number
          phase_type: string
          status?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          fallen_tribute_ids?: string[]
          game_id?: string
          id?: string
          phase_order?: number
          phase_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_phases_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          arena_description: string
          arena_name: string
          created_at: string
          current_day: number
          current_phase_type: string
          ended_at: string | null
          id: string
          settings: Json
          status: Database["public"]["Enums"]["game_status"]
          title: string
          tribute_count: number
          updated_at: string
          user_id: string
          winner_id: string | null
        }
        Insert: {
          arena_description?: string
          arena_name?: string
          created_at?: string
          current_day?: number
          current_phase_type?: string
          ended_at?: string | null
          id?: string
          settings?: Json
          status?: Database["public"]["Enums"]["game_status"]
          title?: string
          tribute_count?: number
          updated_at?: string
          user_id: string
          winner_id?: string | null
        }
        Update: {
          arena_description?: string
          arena_name?: string
          created_at?: string
          current_day?: number
          current_phase_type?: string
          ended_at?: string | null
          id?: string
          settings?: Json
          status?: Database["public"]["Enums"]["game_status"]
          title?: string
          tribute_count?: number
          updated_at?: string
          user_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "tributes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          tokens_balance: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          tokens_balance?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          tokens_balance?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      tributes: {
        Row: {
          avatar_url: string | null
          created_at: string
          death_phase_id: string | null
          district: number
          game_id: string
          gender: Database["public"]["Enums"]["tribute_gender"]
          id: string
          inventory: Json
          kill_count: number
          name: string
          personality: string | null
          physical_aspect: string | null
          placement: number | null
          stats: Json
          status: Database["public"]["Enums"]["tribute_status"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          death_phase_id?: string | null
          district: number
          game_id: string
          gender?: Database["public"]["Enums"]["tribute_gender"]
          id?: string
          inventory?: Json
          kill_count?: number
          name: string
          personality?: string | null
          physical_aspect?: string | null
          placement?: number | null
          stats?: Json
          status?: Database["public"]["Enums"]["tribute_status"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          death_phase_id?: string | null
          district?: number
          game_id?: string
          gender?: Database["public"]["Enums"]["tribute_gender"]
          id?: string
          inventory?: Json
          kill_count?: number
          name?: string
          personality?: string | null
          physical_aspect?: string | null
          placement?: number | null
          stats?: Json
          status?: Database["public"]["Enums"]["tribute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tributes_death_phase_id_fkey"
            columns: ["death_phase_id"]
            isOneToOne: false
            referencedRelation: "game_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tributes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      game_status: "setup" | "in_progress" | "finished" | "archived"
      tribute_gender: "male" | "female" | "non_binary" | "unspecified"
      tribute_status: "alive" | "dead"
      user_role: "user" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      game_status: ["setup", "in_progress", "finished", "archived"],
      tribute_gender: ["male", "female", "non_binary", "unspecified"],
      tribute_status: ["alive", "dead"],
      user_role: ["user", "admin"],
    },
  },
} as const
