import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from "../utils/random_utils";
import { Card } from "./card";
import { createRoundClassFromMemento, Round, RoundClass } from "./round"

export type Game = {
    readonly players: string[];
    readonly targetScore: number;
    readonly playerCount: number;
    player(index: number): string;
    score(index: number): number;
    winner(): number | undefined;
    currentRound(): Round | undefined;
    toMemento(): GameMemento;
};

export type GameMemento = {
    cardsPerPlayer: number;
    players: string[];
    targetScore: number;
    scores: number[];
    currentRound?: any;
};

class UnoGame implements Game {
    public players: string[];
    public targetScore: number;
    private scores: number[];
    private _currentRound?: RoundClass;
    private readonly randomizer: Randomizer;
    private readonly shuffler: Shuffler<Card>;
    private readonly cardsPerPlayer: number;

    constructor(
        players: string[],
        targetScore: number,
        opts?: {
            randomizer?: Randomizer;
            shuffler?: Shuffler<Card>;
            cardsPerPlayer?: number;
            startRound?: boolean;
            roundFromMemento?: any;
        }
    ) {
        if (!players || players.length < 2) {
            throw new Error("At least 2 players are required");
        }
        if (!Number.isFinite(targetScore) || targetScore <= 0) {
            throw new Error("Target score must be greater than 0");
        }

        this.players = players.slice();
        this.targetScore = targetScore;
        this.scores = Array(this.players.length).fill(0);
        this.randomizer = opts?.randomizer ?? standardRandomizer;
        this.shuffler = opts?.shuffler ?? standardShuffler;
        this.cardsPerPlayer = opts?.cardsPerPlayer ?? 7;

        if (opts?.roundFromMemento) {
            this._currentRound = createRoundClassFromMemento(opts.roundFromMemento, this.shuffler) as RoundClass;
            this._currentRound.onEnd(({ winner }) => this.onRoundEnd(winner, this._currentRound!));
        } else if (opts?.startRound !== false) {
            const dealer = Math.floor(this.randomizer(this.players.length));
            this._currentRound = new RoundClass(this.players, dealer, this.shuffler, this.cardsPerPlayer);
            this._currentRound.onEnd(({ winner }) => this.onRoundEnd(winner, this._currentRound!));
        }
    }

    get playerCount(): number {
        return this.players.length;
    }

    player(index: number): string {
        if (!Number.isInteger(index) || index < 0 || index >= this.players.length) {
            throw new Error("Player index out of bounds");
        }
        return this.players[index];
    }

    score(index: number): number {
        if (!Number.isInteger(index) || index < 0 || index >= this.players.length) {
            throw new Error("Player index out of bounds");
        }
        return this.scores[index];
    }

    winner(): number | undefined {
        let winIdx: number | undefined = undefined;
        for (let i = 0; i < this.scores.length; i++) {
            if (this.scores[i] >= this.targetScore) {
                winIdx = i;
                break;
            }
        }
        return winIdx;
    }

    currentRound(): Round | undefined {
        return this._currentRound;
    }

    toMemento(): GameMemento {
        const base: any = {
            cardsPerPlayer: this.cardsPerPlayer,
            players: this.players.slice(),
            targetScore: this.targetScore,
            scores: this.scores.slice(),
        };
        if (this._currentRound) {
            base.currentRound = this._currentRound.toMemento();
        }
        return base as GameMemento;
    }

    private onRoundEnd(winnerIndex: number, round: RoundClass) {
        const gained = round.score() ?? 0;
        this.scores[winnerIndex] += gained;

        if (this.winner() !== undefined) {
            this._currentRound = undefined;
            return;
        }

        const dealer = winnerIndex;
        this._currentRound = new RoundClass(this.players, dealer, this.shuffler, this.cardsPerPlayer);
        this._currentRound.onEnd(({ winner }) => this.onRoundEnd(winner, this._currentRound!));
    }
}

export function createUnoGame(
    players?: string[],
    targetScore?: number,
    opts?: { randomizer?: Randomizer; shuffler?: Shuffler<Card>; cardsPerPlayer?: number }
): Game {
    const p = players ?? ["A", "B"];
    const t = targetScore ?? 500;
    return new UnoGame(p, t, { ...opts });
}

export function createUnoGameFromMemento(
    m: GameMemento,
    opts?: { randomizer?: Randomizer; shuffler?: Shuffler<Card> }
): Game {
    if (!Array.isArray(m.players) || m.players.length < 2) {
        throw new Error("Invalid memento: at least 2 players are required.");
    }
    if (!Number.isFinite(m.targetScore) || m.targetScore <= 0) {
        throw new Error("Invalid memento: target score must be greater than 0.");
    }
    if (!Array.isArray(m.scores) || m.scores.length !== m.players.length) {
        throw new Error("Invalid memento: scores length must equal players length.");
    }
    // Non-negative scores
    if (m.scores.some(s => !Number.isFinite(s) || s < 0)) {
        throw new Error("Invalid memento: scores must be non-negative numbers.");
    }

    const winners = m.scores
        .map((s, i) => ({ i, s }))
        .filter(x => x.s >= m.targetScore)
        .map(x => x.i);

    if (winners.length > 1) {
        throw new Error("Invalid memento: several winners already reached target.");
    }

    const isFinished = winners.length === 1;

    if (!isFinished && !m.currentRound) {
        throw new Error("Invalid memento: missing currentRound for an unfinished game.");
    }

    const game = new UnoGame(m.players, m.targetScore, {
        randomizer: opts?.randomizer ?? standardRandomizer,
        shuffler: opts?.shuffler ?? standardShuffler,
        cardsPerPlayer: m.cardsPerPlayer ?? 7,
        startRound: false,
        roundFromMemento: isFinished ? undefined : m.currentRound,
    });

    (game as any).scores = m.scores.slice();

    return game;
}