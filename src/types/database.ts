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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      games: {
        Row: {
          arena_biome: string
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
          arena_biome?: string
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
          arena_biome?: string
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
