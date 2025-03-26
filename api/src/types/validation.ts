import { Card } from './card';

export interface ValidationError {
  cardName: string;
  errorType: 'NOT_FOUND' | 'FORMAT_VIOLATION' | 'DECK_VIOLATION';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationRequest {
  deckText: string;
  format?: string; // Optional format specification
}

export interface ValidationResponse {
  valid: boolean;
  deck: {
    mainboard: Card[];
    sideboard: Card[];
    commanders?: Card[];
  };
  errors?: ValidationError[];
}
