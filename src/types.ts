export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export enum Rank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A',
}

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'menu' | 'waiting' | 'playing' | 'choosing_suit' | 'game_over';

export interface GameState {
  deck: CardData[];
  discardPile: CardData[];
  playerHand: CardData[];
  aiHand: CardData[];
  currentPlayer: 'player' | 'ai';
  status: GameStatus;
  winner: 'player' | 'ai' | null;
  currentSuit: Suit | null; // For wild 8s
}
