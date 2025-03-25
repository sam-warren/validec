import { Request, Response } from 'express';
import { BadRequestError } from '../types/errors';
import { Body, Controller, Post, Route, SuccessResponse, Tags } from 'tsoa';
import { ValidationService } from '../services/validationService';
import { ConvertService } from '../services/convertService';

interface ValidationRequest {
  cards: string[];
  format?: string; // Optional format specification (e.g., 'commander', 'modern', 'standard')
}

interface ConvertAndValidateRequest {
  deckText: string;
  format?: string; // Optional format specification
}

interface ValidationResponse {
  valid: boolean;
  errors?: ValidationError[];
}

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

@Route('api/validate')
@Tags('Validation')
export class ValidationController {
  private validationService: ValidationService;
  private convertService: ConvertService;

  constructor() {
    this.validationService = new ValidationService();
    this.convertService = new ConvertService();
  }

  // /**
  //  * Validates a decklist against Scryfall API and format rules
  //  * @param requestBody The validation request containing card list and optional format
  //  */
  // @Post()
  // @SuccessResponse('200', 'Validation completed')
  // public async validateDecklist(
  //   @Body() requestBody: ValidationRequest
  // ): Promise<ValidationResponse> {
  //   try {
  //     const { cards, format = 'commander' } = requestBody;
      
  //     if (!cards || !Array.isArray(cards) || cards.length === 0) {
  //       throw new BadRequestError('Cards array is required and must not be empty');
  //     }
      
  //     // Use the validation service to handle all validation logic
  //     const validationResponse = await this.validationService.validateDeck(cards, format);
      
  //     return validationResponse;
  //   } catch (error) {
  //     if (error instanceof BadRequestError) {
  //       throw error;
  //     } else {
  //       console.error('Error validating decklist:', error);
  //       throw new Error('An error occurred during validation');
  //     }
  //   }
  // }

  /**
   * Converts a deck file/text and validates it against Scryfall API and format rules
   * @param requestBody The request containing deck text and optional format
   */
  @Post()
  @SuccessResponse('200', 'Conversion and validation completed')
  public async convertAndValidateDecklist(
    @Body() requestBody: ConvertAndValidateRequest
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
        ...deck.mainboard.flatMap(card => Array(card.quantity).fill(card.name)),
        ...deck.sideboard.flatMap(card => Array(card.quantity).fill(card.name)),
        ...(deck.commanders?.flatMap(card => Array(card.quantity).fill(card.name)) || [])
      ];
      
      // Use the format from the converted deck if not explicitly provided
      const formatToUse = format || deck.format || 'commander';
      
      // Validate the extracted cards
      const validationResponse = await this.validationService.validateDeck(cards, formatToUse);
      
      return validationResponse;
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
