/** Supabase Database type definitions — generated from schema */

export type MemberRelationship =
  | 'mother'
  | 'father'
  | 'grandma'
  | 'grandpa'
  | 'aunt'
  | 'uncle'
  | 'other'

export type InviteStatus = 'pending' | 'accepted' | 'expired'
export type TransactionType = 'earn' | 'redeem' | 'deduct'
export type TransactionStatus = 'approved' | 'pending' | 'denied'

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string | null
          email: string
          display_name: string
          relationship: MemberRelationship
          is_owner: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id?: string | null
          email: string
          display_name: string
          relationship?: MemberRelationship
          is_owner?: boolean
          joined_at?: string
        }
        Update: {
          display_name?: string
          relationship?: MemberRelationship
        }
      }
      invites: {
        Row: {
          id: string
          family_id: string
          invited_by: string
          email: string | null
          token: string
          relationship: MemberRelationship
          status: InviteStatus
          created_at: string
          expires_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          family_id: string
          invited_by: string
          email?: string | null
          token: string
          relationship?: MemberRelationship
          status?: InviteStatus
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: {
          status?: InviteStatus
          accepted_at?: string | null
        }
      }
      kids: {
        Row: {
          id: string
          family_id: string
          name: string
          avatar: string
          color_accent: string
          wishlist: string[]
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          avatar?: string
          color_accent?: string
          wishlist?: string[]
          created_at?: string
        }
        Update: {
          name?: string
          avatar?: string
          color_accent?: string
          wishlist?: string[]
        }
      }
      categories: {
        Row: {
          id: string
          family_id: string
          name: string
          icon: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          icon?: string
        }
        Update: {
          name?: string
          icon?: string
        }
      }
      actions: {
        Row: {
          id: string
          family_id: string
          name: string
          description: string
          category_id: string | null
          points_value: number
          is_deduction: boolean
          badge_id: string | null
          is_template: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          description?: string
          category_id?: string | null
          points_value?: number
          is_deduction?: boolean
          badge_id?: string | null
          is_template?: boolean
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string
          category_id?: string | null
          points_value?: number
          is_deduction?: boolean
          badge_id?: string | null
          is_template?: boolean
          is_active?: boolean
        }
      }
      badges: {
        Row: {
          id: string
          family_id: string
          name: string
          icon: string
          description: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          icon?: string
          description?: string
        }
        Update: {
          name?: string
          icon?: string
          description?: string
        }
      }
      rewards: {
        Row: {
          id: string
          family_id: string
          name: string
          description: string
          points_cost: number
          is_active: boolean
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          description?: string
          points_cost?: number
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string
          points_cost?: number
          is_active?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          kid_id: string
          type: TransactionType
          amount: number
          action_id: string | null
          reward_id: string | null
          status: TransactionStatus
          timestamp: string
          note: string | null
          reason: string | null
        }
        Insert: {
          id?: string
          kid_id: string
          type: TransactionType
          amount: number
          action_id?: string | null
          reward_id?: string | null
          status?: TransactionStatus
          timestamp?: string
          note?: string | null
          reason?: string | null
        }
        Update: {
          status?: TransactionStatus
          note?: string | null
          reason?: string | null
        }
      }
      kid_badges: {
        Row: {
          kid_id: string
          badge_id: string
          awarded_at: string
        }
        Insert: {
          kid_id: string
          badge_id: string
          awarded_at?: string
        }
        Update: Record<string, never>
      }
    }
    Functions: {
      user_family_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
    }
  }
}
