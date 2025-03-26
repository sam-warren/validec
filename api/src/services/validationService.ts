import { ValidationResult } from '../types/validation';
import { ScryfallCard } from '../types/card';
import { ScryfallService } from './scryfallService';

/**
 * Service for validating decklists
 *
 * @export
 * @class ValidationService
 */
export class ValidationService {
  private scryfallService: ScryfallService;

  constructor() {
    this.scryfallService = new ScryfallService();
  }

  /**
   * Validate a decklist
   *
   * @param {string[]} cards
   * @param {string} [format='commander']
   * @return {*}  {Promise<ValidationResult>}
   * @memberof ValidationService
   */
  async validateDeck(cards: string[], format: string = 'commander'): Promise<ValidationResult> {
    // Initialize result
    const result: ValidationResult = { valid: true, errors: [] };

    // Transform the decklist
    const transformedDecklist = this.transformDecklist(cards);

    // Fetch card data
    const cardData = await this.scryfallService.fetchCardData(transformedDecklist);

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

    // // If there are no errors, ensure the errors array is not included in the response
    // if (result.valid) {
    //   delete result.errors;
    // }

    console.log('result', result);
    return result;
  }

  /**
   * Transform the decklist into a format that can be used by the validation service
   *
   * @param {string[]} decklist
   * @return {*}  {string[]}
   * @memberof ValidationService
   */
  transformDecklist(decklist: string[]): string[] {
    // For now, just trim each card name
    return decklist.map((card) => card.trim());
  }

  /**
   *
   *
   * @param {(Array<{ cardName: string; found: boolean; data: ScryfallCard | null }>)} cardResults
   * @param {string} format
   * @return {*}  {ValidationResult}
   * @memberof ValidationService
   */
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

  /**
   * Validate the decklist against the format rules
   *
   * @param {string[]} cards
   * @param {string} format
   * @return {*}  {ValidationResult}
   * @memberof ValidationService
   */
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
