import axios from 'axios';
import { ScryfallCard } from '../types/card';

/**
 * Service for interacting with the Scryfall API
 *
 * @export
 * @class ScryfallService
 */
export class ScryfallService {
  private readonly API_BASE_URL = 'https://api.scryfall.com';
  private readonly CHUNK_SIZE = 75; // Scryfall's limit per request

  /**
   * Fetch card data from Scryfall for a list of card names
   *
   * @param {string[]} cardNames
   * @return {*}  {(Promise<Array<{ cardName: string; found: boolean; data: ScryfallCard | null }>>)}
   * @memberof ScryfallService
   */
  async fetchCardData(
    cardNames: string[]
  ): Promise<Array<{ cardName: string; found: boolean; data: ScryfallCard | null }>> {
    // Split cardNames into chunks of 75 (Scryfall's limit per request)
    const cardChunks = [];
    for (let i = 0; i < cardNames.length; i += this.CHUNK_SIZE) {
      cardChunks.push(cardNames.slice(i, i + this.CHUNK_SIZE));
    }

    const allResults: Array<{ cardName: string; found: boolean; data: ScryfallCard | null }> = [];

    // Process each chunk with a collection request
    for (const chunk of cardChunks) {
      try {
        const response = await axios.post(
          `${this.API_BASE_URL}/cards/collection`,
          {
            identifiers: chunk.map((cardName) => ({ name: cardName.trim() }))
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
        chunk.forEach((cardName) => {
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
}

export default new ScryfallService();
