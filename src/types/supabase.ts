export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          created_at: string
          code: string
          status: 'waiting' | 'playing' | 'finished'
          currentQuestion: number
          hostId: string
        }
        Insert: {
          id?: string
          created_at?: string
          code: string
          status: 'waiting' | 'playing' | 'finished'
          currentQuestion: number
          hostId: string
        }
        Update: {
          id?: string
          created_at?: string
          code?: string
          status?: 'waiting' | 'playing' | 'finished'
          currentQuestion?: number
          hostId?: string
        }
      }
      players: {
        Row: {
          id: string
          created_at: string
          gameId: string
          initials: string
          score: number
        }
        Insert: {
          id?: string
          created_at?: string
          gameId: string
          initials: string
          score?: number
        }
        Update: {
          id?: string
          created_at?: string
          gameId?: string
          initials?: string
          score?: number
        }
      }
      answers: {
        Row: {
          id: string
          created_at: string
          gameId: string
          playerId: string
          questionNumber: number
          latitude: number
          longitude: number
          distance: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          gameId: string
          playerId: string
          questionNumber: number
          latitude: number
          longitude: number
          distance?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          gameId?: string
          playerId?: string
          questionNumber?: number
          latitude?: number
          longitude?: number
          distance?: number | null
        }
      }
    }
  }
}