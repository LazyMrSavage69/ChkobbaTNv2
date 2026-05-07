export type Suit = 'coupe' | 'carreau' | 'trefle' | 'pique';

export type GameModeType = '1v1' | '2v2' | 'normal';

export interface Card {
  id: string;
  value: number; // 1-10
  suit: Suit;
  label_ar: string;
  label_fr: string;
  image_asset: string;
}

export interface Player {
  id: string;
  username: string;
  avatar_url?: string;
  seat: number;
  hand: Card[];
  is_ready: boolean;
  has_cigarette: boolean;
  team?: number; // For 2v2 mode
}

export interface Move {
  id?: string;
  room_id: string;
  user_id: string;
  card_played: Card;
  action: string;
  created_at?: string;
}

export interface GameState {
  id?: string;
  room_id: string;
  state_json: {
    players: Player[];
    current_player_index: number;
    center_pile: Card[];
    round: number;
    phase: 'waiting' | 'playing' | 'round_end' | 'game_over';
    scores: Record<string, number>;
    team_scores?: Record<number, number>; // For 2v2
    last_move?: Move;
    deck: Card[];
    trump_suit?: Suit;
    mode: GameModeType;
  };
  current_turn: string;
  round: number;
  created_at?: string;
}

export interface Room {
  id: string;
  name: string;
  mode: GameModeType;
  status: 'waiting' | 'playing' | 'finished';
  host_id: string;
  max_players: number;
  join_code?: string;
  is_private?: boolean;
  created_at: string;
  players?: RoomPlayer[];
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  seat: number;
  is_ready: boolean;
  joined_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  wins: number;
  losses: number;
  has_cigarette: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  rank: number;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
    wins: number;
    losses: number;
  };
}

export interface GameMode {
  name: string;
  init(players: Player[]): GameState['state_json'];
  onCardPlay(state: GameState['state_json'], move: Move): GameState['state_json'];
  onTurnEnd(state: GameState['state_json']): GameState['state_json'];
  onRoundEnd(state: GameState['state_json']): GameState['state_json'];
  checkWin(state: GameState['state_json']): Player | Player[] | null;
}
