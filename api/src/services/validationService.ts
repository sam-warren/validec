import axios from 'axios';

interface ValidationError {
  cardName: string;
  errorType: 'NOT_FOUND' | 'FORMAT_VIOLATION' | 'DECK_VIOLATION';
  message: string;
}

interface ScryfallCard {
  id: string;
  name: string;
  legalities: Record<string, string>;
  // Add other relevant scryfall properties as needed
}

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export class ValidationService {
  // Main function to validate a decklist
  async validateDeck(cards: string[], format: string = 'commander'): Promise<ValidationResult> {
    // Initialize result
    const result: ValidationResult = { valid: true, errors: [] };

    // Transform the decklist
    const transformedDecklist = this.transformDecklist(cards);

    // Fetch card data
    const cardData = await this.fetchCardData(transformedDecklist);

    // Validate card data against format
    const cardValidation = this.validateCardData(cardData, format);
    if (!cardValidation.valid) {
      result.valid = false;
      result.errors = [...(result.errors || []), ...(cardValidation.errors || [])];
    }

    // Validate decklist rules (deck size, etc.)
    const deckValidation = this.validateDecklist(cards, format);
    if (!deckValidation.valid) {
      result.valid = false;
      result.errors = [...(result.errors || []), ...(deckValidation.errors || [])];
    }

    // If there are no errors, ensure the errors array is not included in the response
    if (result.valid) {
      delete result.errors;
    }

    return result;
  }

  // Transform the decklist into a format that can be used by the validation service
  transformDecklist(decklist: string[]): string[] {
    // For now, just trim each card name
    return decklist.map((card) => card.trim());
  }

  // Fetch card(s) data from scryfall
  async fetchCardData(
    cardNames: string[]
  ): Promise<Array<{ cardName: string; found: boolean; data: ScryfallCard | null }>> {
    // Split cardNames into chunks of 75 (Scryfall's limit per request)
    const chunkSize = 75;
    const cardChunks = [];
    for (let i = 0; i < cardNames.length; i += chunkSize) {
      cardChunks.push(cardNames.slice(i, i + chunkSize));
    }

    const allResults: Array<{ cardName: string; found: boolean; data: ScryfallCard | null }> = [];

    // Process each chunk with a collection request
    for (const chunk of cardChunks) {
      try {
        const response = await axios.post(
          'https://api.scryfall.com/cards/collection',
          {
            identifiers: chunk.map(cardName => ({ name: cardName.trim() }))
          },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        // Map found cards to our result format
        const foundCards = response.data.data || [];
        const notFoundCards = response.data.not_found || [];
        
        // Add found cards to results
        foundCards.forEach((card: ScryfallCard) => {
          allResults.push({
            cardName: card.name,
            found: true,
            data: card
          });
        });

        // Add not found cards to results
        notFoundCards.forEach((identifier: { name: string }) => {
          allResults.push({
            cardName: identifier.name,
            found: false,
            data: null
          });
        });
      } catch (error) {
        // If the API request fails, mark all cards in this chunk as not found
        chunk.forEach(cardName => {
          allResults.push({
            cardName,
            found: false,
            data: null
          });
        });
      }
    }

    return allResults;
  }

  // Validate the card(s) data
  validateCardData(
    cardResults: Array<{ cardName: string; found: boolean; data: ScryfallCard | null }>,
    format: string
  ): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    // Check for cards not found
    cardResults.forEach((card) => {
      if (!card.found) {
        result.valid = false;
        result.errors?.push({
          cardName: card.cardName,
          errorType: 'NOT_FOUND',
          message: `Card "${card.cardName}" not found in Scryfall database`
        });
      }
    });

    // Validate cards against format rules
    const foundCards = cardResults.filter((card) => card.found).map((card) => card.data);
    foundCards.forEach((card) => {
      if (card && card.legalities[format.toLowerCase()] !== 'legal') {
        result.valid = false;
        result.errors?.push({
          cardName: card.name,
          errorType: 'FORMAT_VIOLATION',
          message: `Card "${card.name}" is not legal in ${format} format`
        });
      }
    });

    return result;
  }

  // Validate decklist rules
  validateDecklist(cards: string[], format: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    // Format-specific deck validation rules
    if (format.toLowerCase() === 'commander') {
      // Check if deck has exactly 100 cards for Commander
      if (cards.length !== 100) {
        result.valid = false;
        result.errors?.push({
          cardName: '',
          errorType: 'DECK_VIOLATION',
          message: `Commander decks must contain exactly 100 cards, found ${cards.length}`
        });
      }

      // Additional commander-specific rules could be added here
    }

    // Add validation rules for other formats if needed

    return result;
  }
}
