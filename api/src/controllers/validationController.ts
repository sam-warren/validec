import { BadRequestError } from '../types/errors';
import { Body, Post, Route, SuccessResponse, Tags } from 'tsoa';
import { ValidationService } from '../services/validationService';
import { ConvertService } from '../services/convertService';
import { ValidationRequest, ValidationResponse } from '../types/validation';

@Route('api/validate')
@Tags('Validation')
export class ValidationController {
  private validationService: ValidationService;
  private convertService: ConvertService;

  constructor() {
    this.validationService = new ValidationService();
    this.convertService = new ConvertService();
  }

  /**
   * Converts a deck file/text and validates it against Scryfall API and format rules
   * @param requestBody The request containing deck text and optional format
   */
  @Post()
  @SuccessResponse('200', 'Conversion and validation completed')
  public async ValidateDecklist(
    @Body() requestBody: ValidationRequest
  ): Promise<ValidationResponse> {
    try {
      const { deckText, format } = requestBody;

      if (!deckText || typeof deckText !== 'string' || deckText.trim() === '') {
        throw new BadRequestError('Deck text is required and must not be empty');
      }

      // Normalize line endings to ensure consistent processing
      const normalizedDeckText = deckText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Convert the deck text to a structured format
      const deck = this.convertService.convertDeckText(normalizedDeckText);

      // Extract card names from the converted deck
      const cards = [
        ...deck.mainboard.flatMap((card) => Array(card.quantity).fill(card.name)),
        ...deck.sideboard.flatMap((card) => Array(card.quantity).fill(card.name))
      ];

      // Use the format from the converted deck if not explicitly provided
      const formatToUse = format || deck.format || 'commander';

      // Validate the extracted cards
      const validationResponse = await this.validationService.validateDeck(cards, formatToUse);

      return {
        valid: validationResponse.valid,
        errors: validationResponse.errors,
        deck: {
          mainboard: deck.mainboard,
          sideboard: deck.sideboard
        }
      };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      } else {
        console.error('Error converting and validating decklist:', error);
        throw new Error('An error occurred during conversion and validation');
      }
    }
  }
}
