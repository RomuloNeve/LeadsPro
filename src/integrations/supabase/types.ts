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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      affiliates: {
        Row: {
          created_at: string
          enterprise_link: string | null
          id: string
          is_active: boolean
          name: string
          profissional_link: string | null
          slug: string
          starter_link: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          enterprise_link?: string | null
          id?: string
          is_active?: boolean
          name: string
          profissional_link?: string | null
          slug: string
          starter_link?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          enterprise_link?: string | null
          id?: string
          is_active?: boolean
          name?: string
          profissional_link?: string | null
          slug?: string
          starter_link?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_error_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          error_message: string
          function_name: string
          id: string
          instance_name: string | null
          request_payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          error_message: string
          function_name: string
          id?: string
          instance_name?: string | null
          request_payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          error_message?: string
          function_name?: string
          id?: string
          instance_name?: string | null
          request_payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string
          cluster: string | null
          content: string
          created_at: string
          excerpt: string
          hero_image_url: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          page_type: string | null
          parent_slug: string | null
          published_at: string
          read_time: string
          slug: string
          title: string
          word_count: number | null
        }
        Insert: {
          category: string
          cluster?: string | null
          content: string
          created_at?: string
          excerpt: string
          hero_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          page_type?: string | null
          parent_slug?: string | null
          published_at?: string
          read_time?: string
          slug: string
          title: string
          word_count?: number | null
        }
        Update: {
          category?: string
          cluster?: string | null
          content?: string
          created_at?: string
          excerpt?: string
          hero_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          page_type?: string | null
          parent_slug?: string | null
          published_at?: string
          read_time?: string
          slug?: string
          title?: string
          word_count?: number | null
        }
        Relationships: []
      }
      campaign_sent_leads: {
        Row: {
          campaign_id: string
          error_reason: string | null
          id: string
          lead_id: string
          sent_at: string
          status: string
        }
        Insert: {
          campaign_id: string
          error_reason?: string | null
          id?: string
          lead_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          campaign_id?: string
          error_reason?: string | null
          id?: string
          lead_id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sent_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sent_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audio_urls: string[] | null
          campaign_type: string
          created_at: string
          group_ids: string[] | null
          group_sent_phones: string[] | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          license_id: string
          message_template: string
          name: string
          sent_count: number
          status: string
          target_filter: Json | null
          total_leads: number
          updated_at: string
        }
        Insert: {
          audio_urls?: string[] | null
          campaign_type?: string
          created_at?: string
          group_ids?: string[] | null
          group_sent_phones?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          license_id: string
          message_template?: string
          name: string
          sent_count?: number
          status?: string
          target_filter?: Json | null
          total_leads?: number
          updated_at?: string
        }
        Update: {
          audio_urls?: string[] | null
          campaign_type?: string
          created_at?: string
          group_ids?: string[] | null
          group_sent_phones?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          license_id?: string
          message_template?: string
          name?: string
          sent_count?: number
          status?: string
          target_filter?: Json | null
          total_leads?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_configs: {
        Row: {
          auto_reply_all: boolean
          created_at: string
          id: string
          is_active: boolean
          license_id: string
          name: string
          scheduling_link: string | null
          system_prompt: string
          updated_at: string
        }
        Insert: {
          auto_reply_all?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          license_id: string
          name?: string
          scheduling_link?: string | null
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          auto_reply_all?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          license_id?: string
          name?: string
          scheduling_link?: string | null
          system_prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_configs_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_files: {
        Row: {
          config_id: string
          created_at: string
          file_name: string
          file_path: string
          file_url: string
          id: string
        }
        Insert: {
          config_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_url: string
          id?: string
        }
        Update: {
          config_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_files_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "chatbot_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_leads: {
        Row: {
          config_id: string
          created_at: string
          id: string
          is_active: boolean
          lead_phone: string
          messages_count: number
          updated_at: string
        }
        Insert: {
          config_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          lead_phone: string
          messages_count?: number
          updated_at?: string
        }
        Update: {
          config_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lead_phone?: string
          messages_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_leads_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "chatbot_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          license_id: string
          payment_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          license_id: string
          payment_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          license_id?: string
          payment_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body: string
          category_filter: string | null
          created_at: string
          id: string
          license_id: string
          name: string
          sent_count: number
          status: string
          subject: string
          total_leads: number
          updated_at: string
        }
        Insert: {
          body: string
          category_filter?: string | null
          created_at?: string
          id?: string
          license_id: string
          name: string
          sent_count?: number
          status?: string
          subject: string
          total_leads?: number
          updated_at?: string
        }
        Update: {
          body?: string
          category_filter?: string | null
          created_at?: string
          id?: string
          license_id?: string
          name?: string
          sent_count?: number
          status?: string
          subject?: string
          total_leads?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_logs: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          scheduled_for: string
          sent_at: string | null
          status: string
          step_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          step_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "followup_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_sequences: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          license_id: string
          name: string
          target_filter: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          license_id: string
          name: string
          target_filter?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          license_id?: string
          name?: string
          target_filter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_sequences_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_steps: {
        Row: {
          created_at: string
          day_number: number
          id: string
          message_template: string
          sequence_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          message_template?: string
          sequence_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          message_template?: string
          sequence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "followup_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      free_trial_ips: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          user_id?: string
        }
        Relationships: []
      }
      human_handoff_requests: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          last_message: string | null
          lead_name: string | null
          lead_phone: string
          license_id: string
          remote_jid: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          last_message?: string | null
          lead_name?: string | null
          lead_phone: string
          license_id: string
          remote_jid: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          last_message?: string | null
          lead_name?: string | null
          lead_phone?: string
          license_id?: string
          remote_jid?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "human_handoff_requests_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_list_items: {
        Row: {
          added_at: string
          id: string
          lead_id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          lead_id: string
          list_id: string
        }
        Update: {
          added_at?: string
          id?: string
          lead_id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_list_items_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_lists: {
        Row: {
          color: string
          created_at: string
          id: string
          license_id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          license_id: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          license_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_lists_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          category: string | null
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          is_duplicate: boolean
          lead_score: number | null
          lead_status: string
          license_id: string
          linkedin: string | null
          name: string | null
          notes: string | null
          phone: string | null
          scored_at: string | null
          website: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          is_duplicate?: boolean
          lead_score?: number | null
          lead_status?: string
          license_id: string
          linkedin?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          scored_at?: string | null
          website?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          is_duplicate?: boolean
          lead_score?: number | null
          lead_status?: string
          license_id?: string
          linkedin?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          scored_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          assigned_to: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          extra_credits: number
          id: string
          is_active: boolean
          monthly_credits: number
          plan_type: string
          search_expires_at: string | null
          updated_at: string
          used_credits: number
        }
        Insert: {
          assigned_to?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          extra_credits?: number
          id?: string
          is_active?: boolean
          monthly_credits?: number
          plan_type?: string
          search_expires_at?: string | null
          updated_at?: string
          used_credits?: number
        }
        Update: {
          assigned_to?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          extra_credits?: number
          id?: string
          is_active?: boolean
          monthly_credits?: number
          plan_type?: string
          search_expires_at?: string | null
          updated_at?: string
          used_credits?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_admin: boolean
          user_id: string
          whatsapp_phone: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          user_id: string
          whatsapp_phone?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          user_id?: string
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          phone_connected: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          phone_connected?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          phone_connected?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_free_trial: {
        Args: { p_license_id: string }
        Returns: undefined
      }
      increment_used_credits: {
        Args: { p_amount: number; p_license_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
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
    Enums: {},
  },
} as const
