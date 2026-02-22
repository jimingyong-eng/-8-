import { Suit, Rank, CardData } from './types';

export const SUITS = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
export const RANKS = [
  Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
  Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
];

export const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    });
  });
  return deck;
};

export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const isValidMove = (card: CardData, topCard: CardData, currentSuit: Suit | null): boolean => {
  if (card.rank === Rank.EIGHT) return true;
  
  const targetSuit = currentSuit || topCard.suit;
  return card.suit === targetSuit || card.rank === topCard.rank;
};
