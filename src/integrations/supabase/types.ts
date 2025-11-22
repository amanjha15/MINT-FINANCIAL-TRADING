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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          description: string
          icon: string
          id: string
          requirement_type: string
          requirement_value: number
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon: string
          id?: string
          requirement_type: string
          requirement_value: number
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          requirement_type?: string
          requirement_value?: number
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean | null
          id: string
          initial_value: number | null
          joined_at: string | null
          progress: number | null
          rank: number | null
          streak_count: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          id?: string
          initial_value?: number | null
          joined_at?: string | null
          progress?: number | null
          rank?: number | null
          streak_count?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          id?: string
          initial_value?: number | null
          joined_at?: string | null
          progress?: number | null
          rank?: number | null
          streak_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          description: string
          end_date: string
          id: string
          start_date: string
          target_value: number
          title: string
          xp_reward: number | null
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          description: string
          end_date: string
          id?: string
          start_date: string
          target_value: number
          title: string
          xp_reward?: number | null
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          description?: string
          end_date?: string
          id?: string
          start_date?: string
          target_value?: number
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      company_fundamentals: {
        Row: {
          country: string | null
          created_at: string | null
          description: string | null
          employees: number | null
          id: string
          industry: string | null
          ipo_date: string | null
          logo_url: string | null
          market_cap: number | null
          name: string
          sector: string | null
          shares_outstanding: number | null
          symbol: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          description?: string | null
          employees?: number | null
          id?: string
          industry?: string | null
          ipo_date?: string | null
          logo_url?: string | null
          market_cap?: number | null
          name: string
          sector?: string | null
          shares_outstanding?: number | null
          symbol: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          description?: string | null
          employees?: number | null
          id?: string
          industry?: string | null
          ipo_date?: string | null
          logo_url?: string | null
          market_cap?: number | null
          name?: string
          sector?: string | null
          shares_outstanding?: number | null
          symbol?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      data_collection_log: {
        Row: {
          created_at: string | null
          data_type: string
          error_message: string | null
          id: string
          records_count: number | null
          source: string
          success: boolean
          symbol: string
        }
        Insert: {
          created_at?: string | null
          data_type: string
          error_message?: string | null
          id?: string
          records_count?: number | null
          source: string
          success: boolean
          symbol: string
        }
        Update: {
          created_at?: string | null
          data_type?: string
          error_message?: string | null
          id?: string
          records_count?: number | null
          source?: string
          success?: boolean
          symbol?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          category: string
          content: string
          created_at: string | null
          description: string
          difficulty: string
          id: string
          order_index: number
          practice_start_date: string | null
          practice_stocks: string[] | null
          quiz_questions: Json | null
          scenario_data: Json | null
          title: string
          xp_reward: number
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          description: string
          difficulty: string
          id?: string
          order_index: number
          practice_start_date?: string | null
          practice_stocks?: string[] | null
          quiz_questions?: Json | null
          scenario_data?: Json | null
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          description?: string
          difficulty?: string
          id?: string
          order_index?: number
          practice_start_date?: string | null
          practice_stocks?: string[] | null
          quiz_questions?: Json | null
          scenario_data?: Json | null
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      missions: {
        Row: {
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          mission_type: string
          target_value: number
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          mission_type: string
          target_value: number
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          mission_type?: string
          target_value?: number
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      monitored_stocks: {
        Row: {
          added_at: string | null
          exchange: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          name: string
          symbol: string
        }
        Insert: {
          added_at?: string | null
          exchange?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name: string
          symbol: string
        }
        Update: {
          added_at?: string | null
          exchange?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      platform_stats: {
        Row: {
          id: string
          stat_name: string
          stat_value: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          stat_name: string
          stat_value?: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          stat_name?: string
          stat_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          final_cash: number | null
          gain_loss_amount: number | null
          gain_loss_percent: number | null
          id: string
          initial_cash: number
          lesson_id: string | null
          practice_date: string
          total_value: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          final_cash?: number | null
          gain_loss_amount?: number | null
          gain_loss_percent?: number | null
          id?: string
          initial_cash?: number
          lesson_id?: string | null
          practice_date: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          final_cash?: number | null
          gain_loss_amount?: number | null
          gain_loss_percent?: number | null
          id?: string
          initial_cash?: number
          lesson_id?: string | null
          practice_date?: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_trades: {
        Row: {
          gain_loss_amount: number | null
          gain_loss_percent: number | null
          id: string
          price_at_completion: number | null
          price_at_trade: number
          quantity: number
          session_id: string
          stock_name: string
          symbol: string
          total_cost: number
          trade_type: string
          traded_at: string | null
        }
        Insert: {
          gain_loss_amount?: number | null
          gain_loss_percent?: number | null
          id?: string
          price_at_completion?: number | null
          price_at_trade: number
          quantity: number
          session_id: string
          stock_name: string
          symbol: string
          total_cost: number
          trade_type: string
          traded_at?: string | null
        }
        Update: {
          gain_loss_amount?: number | null
          gain_loss_percent?: number | null
          id?: string
          price_at_completion?: number | null
          price_at_trade?: number
          quantity?: number
          session_id?: string
          stock_name?: string
          symbol?: string
          total_cost?: number
          trade_type?: string
          traded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_trades_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rapid_test_scores: {
        Row: {
          created_at: string
          id: string
          score: number
          streak: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number
          streak?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          streak?: number
          user_id?: string
        }
        Relationships: []
      }
      simulator_holdings: {
        Row: {
          current_price: number
          id: string
          purchase_date: string | null
          purchase_price: number
          quantity: number
          stock_name: string
          symbol: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_price: number
          id?: string
          purchase_date?: string | null
          purchase_price: number
          quantity: number
          stock_name: string
          symbol: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_price?: number
          id?: string
          purchase_date?: string | null
          purchase_price?: number
          quantity?: number
          stock_name?: string
          symbol?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      simulator_portfolios: {
        Row: {
          cash: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cash?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cash?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      simulator_trades: {
        Row: {
          id: string
          price: number
          quantity: number
          stock_name: string
          symbol: string
          total: number
          trade_type: string
          traded_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          price: number
          quantity: number
          stock_name: string
          symbol: string
          total: number
          trade_type: string
          traded_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          price?: number
          quantity?: number
          stock_name?: string
          symbol?: string
          total?: number
          trade_type?: string
          traded_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stock_historical_data: {
        Row: {
          close: number
          created_at: string
          high: number
          id: string
          low: number
          open: number
          period: string
          symbol: string
          timestamp: number
          volume: number
        }
        Insert: {
          close: number
          created_at?: string
          high: number
          id?: string
          low: number
          open: number
          period: string
          symbol: string
          timestamp: number
          volume: number
        }
        Update: {
          close?: number
          created_at?: string
          high?: number
          id?: string
          low?: number
          open?: number
          period?: string
          symbol?: string
          timestamp?: number
          volume?: number
        }
        Relationships: []
      }
      stock_quotes: {
        Row: {
          change: number
          change_percent: number
          high: number
          low: number
          market_cap: number | null
          name: string
          open: number
          pe_ratio: number | null
          previous_close: number
          price: number
          symbol: string
          updated_at: string
          volume: number
        }
        Insert: {
          change: number
          change_percent: number
          high: number
          low: number
          market_cap?: number | null
          name: string
          open: number
          pe_ratio?: number | null
          previous_close: number
          price: number
          symbol: string
          updated_at?: string
          volume: number
        }
        Update: {
          change?: number
          change_percent?: number
          high?: number
          low?: number
          market_cap?: number | null
          name?: string
          open?: number
          pe_ratio?: number | null
          previous_close?: number
          price?: number
          symbol?: string
          updated_at?: string
          volume?: number
        }
        Relationships: []
      }
      stock_quotes_realtime: {
        Row: {
          avg_volume: number | null
          beta: number | null
          change: number
          change_percent: number
          created_at: string | null
          dividend_yield: number | null
          eps: number | null
          high: number
          id: string
          low: number
          market_cap: number | null
          name: string
          open: number
          pe_ratio: number | null
          previous_close: number
          price: number
          source: string
          symbol: string
          timestamp: string | null
          volume: number
          week_52_high: number | null
          week_52_low: number | null
        }
        Insert: {
          avg_volume?: number | null
          beta?: number | null
          change: number
          change_percent: number
          created_at?: string | null
          dividend_yield?: number | null
          eps?: number | null
          high: number
          id?: string
          low: number
          market_cap?: number | null
          name: string
          open: number
          pe_ratio?: number | null
          previous_close: number
          price: number
          source: string
          symbol: string
          timestamp?: string | null
          volume?: number
          week_52_high?: number | null
          week_52_low?: number | null
        }
        Update: {
          avg_volume?: number | null
          beta?: number | null
          change?: number
          change_percent?: number
          created_at?: string | null
          dividend_yield?: number | null
          eps?: number | null
          high?: number
          id?: string
          low?: number
          market_cap?: number | null
          name?: string
          open?: number
          pe_ratio?: number | null
          previous_close?: number
          price?: number
          source?: string
          symbol?: string
          timestamp?: string | null
          volume?: number
          week_52_high?: number | null
          week_52_low?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id: string
          progress?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          id: string
          last_activity_date: string | null
          level: number | null
          streak_days: number | null
          total_lessons_completed: number | null
          total_missions_completed: number | null
          updated_at: string | null
          user_id: string
          xp: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          streak_days?: number | null
          total_lessons_completed?: number | null
          total_missions_completed?: number | null
          updated_at?: string | null
          user_id: string
          xp?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          streak_days?: number | null
          total_lessons_completed?: number | null
          total_missions_completed?: number | null
          updated_at?: string | null
          user_id?: string
          xp?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_historical_data: { Args: never; Returns: undefined }
      clean_old_realtime_quotes: { Args: never; Returns: undefined }
      clean_old_stock_quotes: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_lessons_completed: { Args: never; Returns: undefined }
      update_trades_value: { Args: never; Returns: undefined }
      update_user_count: { Args: never; Returns: undefined }
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
