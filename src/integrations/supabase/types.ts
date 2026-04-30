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
      manual_premium_grants: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string
          note: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          note?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_public: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_public?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          accords: Json | null
          base_notes: string[] | null
          bottle_size: string | null
          brand: string | null
          confidence: number | null
          created_at: string
          description: string | null
          gender: string | null
          heart_notes: string[] | null
          id: string
          image_url: string | null
          is_favorite: boolean
          longevity: number | null
          name: string | null
          occasions: string[] | null
          owned: boolean
          perfumer: string | null
          plain_description: string | null
          raw_ai: Json | null
          reaction: string | null
          seasons: string[] | null
          sillage: number | null
          similar_perfumes: Json | null
          top_notes: string[] | null
          tried: boolean
          updated_at: string
          user_id: string
          user_notes: string | null
          user_rating: number | null
          year: number | null
        }
        Insert: {
          accords?: Json | null
          base_notes?: string[] | null
          bottle_size?: string | null
          brand?: string | null
          confidence?: number | null
          created_at?: string
          description?: string | null
          gender?: string | null
          heart_notes?: string[] | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          longevity?: number | null
          name?: string | null
          occasions?: string[] | null
          owned?: boolean
          perfumer?: string | null
          plain_description?: string | null
          raw_ai?: Json | null
          reaction?: string | null
          seasons?: string[] | null
          sillage?: number | null
          similar_perfumes?: Json | null
          top_notes?: string[] | null
          tried?: boolean
          updated_at?: string
          user_id: string
          user_notes?: string | null
          user_rating?: number | null
          year?: number | null
        }
        Update: {
          accords?: Json | null
          base_notes?: string[] | null
          bottle_size?: string | null
          brand?: string | null
          confidence?: number | null
          created_at?: string
          description?: string | null
          gender?: string | null
          heart_notes?: string[] | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          longevity?: number | null
          name?: string | null
          occasions?: string[] | null
          owned?: boolean
          perfumer?: string | null
          plain_description?: string | null
          raw_ai?: Json | null
          reaction?: string | null
          seasons?: string[] | null
          sillage?: number | null
          similar_perfumes?: Json | null
          top_notes?: string[] | null
          tried?: boolean
          updated_at?: string
          user_id?: string
          user_notes?: string | null
          user_rating?: number | null
          year?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      taste_profile: {
        Row: {
          disliked_accords: string[] | null
          disliked_notes: string[] | null
          favorite_accords: string[] | null
          favorite_notes: string[] | null
          gender_preference: string | null
          notes: string | null
          preferred_intensity: string | null
          preferred_seasons: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          disliked_accords?: string[] | null
          disliked_notes?: string[] | null
          favorite_accords?: string[] | null
          favorite_notes?: string[] | null
          gender_preference?: string | null
          notes?: string | null
          preferred_intensity?: string | null
          preferred_seasons?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          disliked_accords?: string[] | null
          disliked_notes?: string[] | null
          favorite_accords?: string[] | null
          favorite_notes?: string[] | null
          gender_preference?: string | null
          notes?: string | null
          preferred_intensity?: string | null
          preferred_seasons?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_scan_count: { Args: { user_uuid: string }; Returns: number }
      get_public_collection: {
        Args: { _username: string }
        Returns: {
          bottle_size: string
          brand: string
          id: string
          image_url: string
          is_favorite: boolean
          name: string
          owned: boolean
          reaction: string
          tried: boolean
          updated_at: string
        }[]
      }
      get_public_profile: {
        Args: { _username: string }
        Returns: {
          favorite_count: number
          owned_count: number
          tried_count: number
          username: string
          want_count: number
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      app_role: ["admin", "user"],
    },
  },
} as const
