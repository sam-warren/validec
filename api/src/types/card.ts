export interface Card {
  quantity: number;
  name: string;
  set?: string;
  collectorNumber?: string;
  isFoil?: boolean;
}

export interface InputDeck {
  name?: string;
  format?: string;
  mainboard: Card[];
}

export interface Deck {
  name?: string;
  format?: string;
  mainboard: Card[];
  sideboard: Card[];
  metadata: {
    source: string;
    cardCount: number;
    uniqueCardCount: number;
    sideboardCount: number;
    parseDate: string;
  };
}

export interface ScryfallCard extends Card {
  id: string;
  name: string;
  legalities: Record<string, string>;
  // Add other relevant scryfall properties as needed
}
