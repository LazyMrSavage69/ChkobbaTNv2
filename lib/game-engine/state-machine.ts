import { GameState, Move, Player, GameMode } from "@/types";

export type GamePhase = 'waiting' | 'playing' | 'round_end' | 'game_over';

export class GameStateMachine {
  private state: GameState['state_json'];
  private mode: GameMode;

  constructor(mode: GameMode, players: Player[]) {
    this.mode = mode;
    this.state = mode.init(players);
  }

  getState(): GameState['state_json'] {
    return this.state;
  }

  playCard(move: Move): GameState['state_json'] {
    if (this.state.phase !== 'playing') {
      throw new Error('Cannot play card: game is not in playing phase');
    }

    this.state = this.mode.onCardPlay(this.state, move);
    this.state = this.mode.onTurnEnd(this.state);

    const winner = this.mode.checkWin(this.state);
    if (winner) {
      this.state.phase = 'game_over';
    }

    return this.state;
  }

  startGame(): GameState['state_json'] {
    if (this.state.phase !== 'waiting') {
      throw new Error('Cannot start game: not in waiting phase');
    }
    this.state.phase = 'playing';
    return this.state;
  }

  endRound(): GameState['state_json'] {
    if (this.state.phase !== 'playing') {
      throw new Error('Cannot end round: not in playing phase');
    }
    this.state = this.mode.onRoundEnd(this.state);

    if (this.state.phase !== 'game_over') {
      this.state.phase = 'playing';
    }

    return this.state;
  }

  getCurrentPlayer(): Player | undefined {
    return this.state.players[this.state.current_player_index];
  }

  isPlayerTurn(playerId: string): boolean {
    const currentPlayer = this.getCurrentPlayer();
    return currentPlayer?.id === playerId;
  }
}

export function createGameStateMachine(mode: GameMode, players: Player[]): GameStateMachine {
  return new GameStateMachine(mode, players);
}
