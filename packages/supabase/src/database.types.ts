export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          tech_stack: string[];
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          tech_stack?: string[];
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      memories: {
        Row: {
          id: string;
          project_id: string;
          type: string;
          layer: string;
          title: string;
          content: string;
          summary: string | null;
          status: string;
          confidence: number;
          importance: number;
          access_count: number;
          last_accessed_at: string | null;
          expires_at: string | null;
          source_type: string;
          source_ref_id: string | null;
          source_actor_id: string | null;
          metadata: Json;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          type: string;
          layer?: string;
          title: string;
          content: string;
          summary?: string | null;
          status?: string;
          confidence?: number;
          importance?: number;
          access_count?: number;
          last_accessed_at?: string | null;
          expires_at?: string | null;
          source_type?: string;
          source_ref_id?: string | null;
          source_actor_id?: string | null;
          metadata?: Json;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['memories']['Insert']>;
      };
      relationships: {
        Row: {
          id: string;
          project_id: string;
          source_memory_id: string;
          target_memory_id: string;
          type: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_memory_id: string;
          target_memory_id: string;
          type: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['relationships']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
