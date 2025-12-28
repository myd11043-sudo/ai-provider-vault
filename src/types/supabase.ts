export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Default tier colors for UI
export const DEFAULT_TIER_COLORS = [
  { name: 'Gold', value: 'bg-amber-500 text-white' },
  { name: 'Purple', value: 'bg-purple-500 text-white' },
  { name: 'Blue', value: 'bg-blue-500 text-white' },
  { name: 'Green', value: 'bg-green-500 text-white' },
  { name: 'Red', value: 'bg-red-500 text-white' },
  { name: 'Gray', value: 'bg-zinc-500 text-white' },
  { name: 'Light Gray', value: 'bg-zinc-400 text-white' },
];

export interface Database {
  public: {
    Tables: {
      tiers: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          label: string;
          description: string | null;
          color: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          label: string;
          description?: string | null;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          label?: string;
          description?: string | null;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      providers: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          website_url: string | null;
          recharge_url: string | null;
          recharge_url_2: string | null;
          main_thread_url: string | null;
          tier_id: string | null;
          remarks: string | null;
          requires_daily_login: boolean;
          last_reward_claimed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          website_url?: string | null;
          recharge_url?: string | null;
          recharge_url_2?: string | null;
          main_thread_url?: string | null;
          tier_id?: string | null;
          remarks?: string | null;
          requires_daily_login?: boolean;
          last_reward_claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          website_url?: string | null;
          recharge_url?: string | null;
          recharge_url_2?: string | null;
          main_thread_url?: string | null;
          tier_id?: string | null;
          remarks?: string | null;
          requires_daily_login?: boolean;
          last_reward_claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      api_keys: {
        Row: {
          id: string;
          owner_id: string;
          provider_id: string;
          label: string;
          vault_secret_id: string | null;
          key_prefix: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          provider_id: string;
          label: string;
          vault_secret_id?: string | null;
          key_prefix?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          provider_id?: string;
          label?: string;
          vault_secret_id?: string | null;
          key_prefix?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      provider_models: {
        Row: {
          id: string;
          provider_id: string;
          model_name: string;
          model_id: string;
          is_free: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          model_name: string;
          model_id: string;
          is_free?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          model_name?: string;
          model_id?: string;
          is_free?: boolean;
          notes?: string | null;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'super_admin' | 'member';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'super_admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'super_admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
      };
      shared_api_keys: {
        Row: {
          id: string;
          api_key_id: string;
          shared_with_user_id: string;
          shared_by_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          api_key_id: string;
          shared_with_user_id: string;
          shared_by_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          api_key_id?: string;
          shared_with_user_id?: string;
          shared_by_user_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      active_providers: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          website_url: string | null;
          recharge_url: string | null;
          recharge_url_2: string | null;
          main_thread_url: string | null;
          tier_id: string | null;
          remarks: string | null;
          requires_daily_login: boolean;
          last_reward_claimed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
      };
      active_api_keys: {
        Row: {
          id: string;
          owner_id: string;
          provider_id: string;
          label: string;
          vault_secret_id: string | null;
          key_prefix: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
      };
      shared_keys_with_provider: {
        Row: {
          api_key_id: string;
          api_key_label: string;
          key_prefix: string | null;
          key_created_at: string;
          provider_id: string;
          provider_name: string;
          website_url: string | null;
          tier_id: string | null;
          provider_remarks: string | null;
          tier_name: string | null;
          tier_label: string | null;
          tier_color: string | null;
          tier_sort_order: number | null;
          shared_by_user_id: string;
          shared_at: string;
        };
      };
    };
    Functions: {
      store_api_key: {
        Args: {
          p_owner_id: string;
          p_provider_id: string;
          p_label: string;
          p_api_key: string;
        };
        Returns: string;
      };
      get_decrypted_api_key: {
        Args: {
          p_api_key_id: string;
        };
        Returns: string;
      };
      delete_api_key: {
        Args: {
          p_api_key_id: string;
        };
        Returns: boolean;
      };
      update_api_key: {
        Args: {
          p_api_key_id: string;
          p_new_api_key: string;
          p_new_label?: string;
        };
        Returns: boolean;
      };
      is_super_admin: {
        Args: {
          check_user_id?: string;
        };
        Returns: boolean;
      };
      is_member: {
        Args: {
          check_user_id?: string;
        };
        Returns: boolean;
      };
      get_user_role: {
        Args: {
          check_user_id?: string;
        };
        Returns: string;
      };
    };
  };
}

export type Tier = Database['public']['Tables']['tiers']['Row'];
export type TierInsert = Database['public']['Tables']['tiers']['Insert'];
export type TierUpdate = Database['public']['Tables']['tiers']['Update'];

export type Provider = Database['public']['Tables']['providers']['Row'];
export type ProviderInsert = Database['public']['Tables']['providers']['Insert'];
export type ProviderUpdate = Database['public']['Tables']['providers']['Update'];

export type ApiKey = Database['public']['Tables']['api_keys']['Row'];
export type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert'];

export type ProviderModel = Database['public']['Tables']['provider_models']['Row'];
export type ProviderModelInsert = Database['public']['Tables']['provider_models']['Insert'];

export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];

export type SharedApiKey = Database['public']['Tables']['shared_api_keys']['Row'];
export type SharedApiKeyInsert = Database['public']['Tables']['shared_api_keys']['Insert'];

export type SharedKeyWithProvider = Database['public']['Views']['shared_keys_with_provider']['Row'];

export type Role = 'super_admin' | 'member' | 'none';
