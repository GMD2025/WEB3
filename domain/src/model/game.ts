import { Round, RoundInterface } from "./round";

export interface GameInterface {
  playerCounter: number;
  players: { id: string; score: number; name: string }[];
  currentRound: RoundInterface | null;
  addPlayer(playerId: string): boolean;
  startRound(): boolean;
  endRound(): void;
  getCurrentRound(): RoundInterface | null;
}

export class Game implements GameInterface {
  playerCounter: number = 0;
  players: { id: string; score: number; name: string }[] = [];
  currentRound: RoundInterface | null = null;

  addPlayer(name: string): boolean {
    this.playerCounter++;
    const playerId = `player-${this.playerCounter}`;
    this.players.push({
      id: playerId,
      score: 0,
      name: name,
    });
    return true;
  }

  startRound(): boolean {
    if (this.currentRound) return false;
    this.currentRound = new Round(this.players.length);
    return true;
  }

  endRound(): void {
    this.currentRound = null;
  }

  getCurrentRound(): RoundInterface | null {
    return this.currentRound;
  }
}
