export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      webhooks: {
        Row: {
          id: string
          user_id: string
          name: string
          endpoint_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          endpoint_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          endpoint_id?: string
          created_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          id: string
          webhook_id: string
          method: string
          headers: Json
          body: string | null
          query_params: Json | null
          source_ip: string | null
          received_at: string
        }
        Insert: {
          id?: string
          webhook_id: string
          method: string
          headers?: Json
          body?: string | null
          query_params?: Json | null
          source_ip?: string | null
          received_at?: string
        }
        Update: {
          id?: string
          webhook_id?: string
          method?: string
          headers?: Json
          body?: string | null
          query_params?: Json | null
          source_ip?: string | null
          received_at?: string
        }
        Relationships: []
      }
      cron_monitors: {
        Row: {
          id: string
          user_id: string
          name: string
          ping_url: string
          expected_interval: number
          grace_period: number
          last_ping: string | null
          status: string
          alert_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          ping_url: string
          expected_interval: number
          grace_period?: number
          last_ping?: string | null
          status?: string
          alert_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          ping_url?: string
          expected_interval?: number
          grace_period?: number
          last_ping?: string | null
          status?: string
          alert_email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cron_pings: {
        Row: {
          id: string
          monitor_id: string
          received_at: string
        }
        Insert: {
          id?: string
          monitor_id: string
          received_at?: string
        }
        Update: {
          id?: string
          monitor_id?: string
          received_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: string
          stripe_customer_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: string
          stripe_customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: string
          stripe_customer_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Webhook = Tables<'webhooks'>
export type WebhookLog = Tables<'webhook_logs'>
export type CronMonitor = Tables<'cron_monitors'>
export type CronPing = Tables<'cron_pings'>
export type Profile = Tables<'profiles'>
