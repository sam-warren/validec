interface Card {
  quantity: number;
  name: string;
  set?: string;
  collectorNumber?: string;
  isFoil?: boolean;
}

interface Deck {
  name?: string;
  format?: string;
  mainboard: Card[];
  sideboard: Card[];
  commanders?: Card[];
  metadata: {
    source: string;
    cardCount: number;
    uniqueCardCount: number;
    sideboardCount: number;
    parseDate: string;
  };
}

export class ConvertService {
  
  /**
   * Convert a deck file to JSON format
   * @param deckText Raw deck text content
   * @returns Deck object with metadata
   */
  public async convertDeckFile(deckText: string): Promise<Deck> {
    
    // Determine source format based on file name pattern or content
    let source = this.detectSourceFormat(deckText);

    // Parse the deck based on the source format
    return this.parseDeck(deckText, source);
  }

  /**
   * Convert deck text directly to JSON format
   * @param deckText Raw deck text content
   * @returns Deck object with metadata
   */
  public convertDeckText(deckText: string): Deck {
    // Auto-detect source format from content
    const source = this.detectSourceFormat(deckText);
    return this.parseDeck(deckText, source);
  }

  /**
   * Detect the source format based on content patterns
   * @param content Deck content as string
   * @param fileName Optional filename for additional hints
   * @returns Detected source format
   */
  private detectSourceFormat(content: string): string {
    
    // Check content patterns
    if (content.includes('About') && content.includes('Name') && content.includes('Deck')) {
      return 'mtga'; // MTGA usually has these sections
    }
    
    // Check for Moxfield's set code and collector number pattern
    // Look for patterns like: "1 Card Name (SET) 123" or "1 Card Name (SET) 123s *F*"
    const moxfieldPattern = /\d+\s+.+?\s+\([A-Z0-9]{3,4}\)\s+\d+[a-z]?s?/;
    if (moxfieldPattern.test(content) || content.includes('*CMDR*') || content.includes('*F*') || 
        content.includes('SIDEBOARD:')) {
      return 'moxfield';
    }
    
    // Count lines with basic "quantity name" pattern
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const basicFormatLines = lines.filter(line => /^\d+\s+[^\d]/.test(line));
    
    // If most lines follow the basic pattern, it's likely MTGO format
    if (basicFormatLines.length > lines.length * 0.7) {
      return 'mtgo';
    }
    
    return 'unknown';
  }

  /**
   * Parse a deck from string content
   * @param content Deck content as string
   * @param source Source format ('mtgo', 'mtga', 'moxfield', etc.)
   * @returns Deck object with metadata
   */
  public parseDeck(content: string, source: string): Deck {
    const lines = content.trim().split('\n').filter(line => line.trim() !== '');
    
    const deck: Deck = {
      mainboard: [],
      sideboard: [],
      commanders: [],
      metadata: {
        source,
        cardCount: 0,
        uniqueCardCount: 0,
        sideboardCount: 0,
        parseDate: new Date().toISOString()
      }
    };

    let isSideboard = false;
    let isCommander = false;
    let isAboutSection = false;

    // Process MTGA name if available
    if ((source === 'mtga' || source === 'unknown') && content.includes('About') && content.includes('Name')) {
      const nameMatch = content.match(/Name\s+(.*?)(?:\n|$)/);
      if (nameMatch && nameMatch[1]) {
        deck.name = nameMatch[1].trim();
      }
    }

    // For unknown formats, try to detect sideboard marker
    if (source === 'unknown') {
      // Look for common sideboard markers
      const sideboardMarkers = [
        'SIDEBOARD', 'Sideboard', 'sideboard', 'SB:', 'sb:', 
        '//Sideboard', '// Sideboard', '// SIDEBOARD'
      ];
      
      for (const marker of sideboardMarkers) {
        if (content.includes(marker)) {
          // Format has a sideboard section
          break;
        }
      }
    }

    // Process each line
    for (const line of lines) {
      // Skip empty lines
      if (line.trim() === '') {
        continue;
      }
      
      // Check for sideboard section markers
      if (line.trim() === 'SIDEBOARD:' || line.trim() === 'Sideboard' || 
          line.trim() === 'SIDEBOARD' || line.trim() === 'sideboard' ||
          line.trim() === 'SB:' || line.trim() === 'sb:' ||
          line.trim() === '//Sideboard' || line.trim() === '// Sideboard' || 
          line.trim() === '// SIDEBOARD') {
        isSideboard = true;
        continue;
      }
      
      // Skip section header for deck
      if (line.trim() === 'Deck') {
        continue;
      }

      // For unknown formats, check for common sideboard indicators in each line
      if (source === 'unknown') {
        const sideboardIndicators = [
          'SIDEBOARD', 'Sideboard', 'sideboard', 'SB:', 'sb:',
          '//Sideboard', '// Sideboard', '// SIDEBOARD'
        ];
        
        if (sideboardIndicators.some(indicator => line.includes(indicator))) {
          isSideboard = true;
          continue;
        }
      }

      // Check if we're entering the About section (MTGA)
      if (line.trim() === 'About') {
        isAboutSection = true;
        continue;
      }

      // Check if we're exiting the About section (MTGA)
      if (isAboutSection && line.trim() === 'Deck') {
        isAboutSection = false;
        continue;
      }

      // Skip About section content
      if (isAboutSection) {
        continue;
      }

      // Parse commander entries for specific formats
      if ((source === 'moxfield' || source === 'unknown') && !isSideboard) {
        // In Moxfield, check for commander indicators like "1 Commander Name (SET) ### *CMDR*"
        if (line.includes('*CMDR*') || (line.includes('*F*') && deck.commanders?.length === 0) ||
            line.toLowerCase().includes('commander:')) {
          isCommander = true;
        } else {
          isCommander = false;
        }
      }

      // Parse the card
      const card = this.parseCardLine(line, source);
      if (card) {
        if (isSideboard) {
          deck.sideboard.push(card);
          deck.metadata.sideboardCount += card.quantity;
        } else if (isCommander) {
          deck.commanders?.push(card);
        } else {
          deck.mainboard.push(card);
          deck.metadata.cardCount += card.quantity;
        }
      }
    }

    // Set format based on card count and other heuristics
    this.detectDeckFormat(deck);

    // Calculate unique card count
    deck.metadata.uniqueCardCount = deck.mainboard.length;

    return deck;
  }

  /**
   * Detect deck format based on card count and other characteristics
   * @param deck The deck object to analyze
   */
  private detectDeckFormat(deck: Deck): void {
    if (deck.format) return; // Format already set
    
    const totalCards = deck.metadata.cardCount + deck.metadata.sideboardCount;
    
    // Check for commander
    if (deck.commanders && deck.commanders.length > 0) {
      deck.format = 'commander';
      return;
    }
    
    // Check by card count
    if (deck.metadata.cardCount === 100 || totalCards === 100) {
      deck.format = 'commander';
    } else if (deck.metadata.cardCount === 60 || (deck.metadata.cardCount >= 60 && deck.metadata.cardCount <= 63)) {
      // Most constructed formats use 60 cards
      deck.format = 'standard';
    } else if (deck.metadata.cardCount >= 40 && deck.metadata.cardCount <= 45) {
      deck.format = 'limited';
    } else if (deck.metadata.cardCount === 99 || deck.metadata.cardCount === 98) {
      // Commander without commander in separate zone
      deck.format = 'commander';
    } else {
      deck.format = 'unknown';
    }
  }

  /**
   * Parse a single card line based on the source format
   * @param line Line from deck file
   * @param source Source format ('mtgo', 'mtga', 'moxfield')
   * @returns Card object or null if parsing failed
   */
  private parseCardLine(line: string, source: string): Card | null {
    let match;
    let quantity = 1;
    let name = '';
    let set = undefined;
    let collectorNumber = undefined;
    let isFoil = false;

    // Clean up the line if it has unexpected Unicode characters
    const cleanLine = line.replace(/[^\x20-\x7E\s_]/g, '');

    // Match based on source format
    if (source === 'mtgo' || source === 'mtga' || source === 'unknown') {
      // MTGO/MTGA/Unknown: "1 Card Name"
      match = cleanLine.match(/^(\d+)\s+(.+?)$/);
      if (match) {
        quantity = parseInt(match[1], 10);
        name = match[2].trim();
      } else {
        // Try more flexible pattern for unknown formats
        if (source === 'unknown') {
          // Try to extract just the card name if no quantity is specified
          match = cleanLine.match(/^([A-Za-z].+?)$/);
          if (match) {
            name = match[1].trim();
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
    } else if (source === 'moxfield') {
      // Moxfield: "1 Card Name (SET) 123 *F*" or "1 Card Name (SET) 123s *F*"
      match = cleanLine.match(/^(\d+)\s+(.+?)(?:\s+\(([A-Z0-9]{3,4})\))?(?:\s+(\d+[a-z]?s?))?(\s+\*F\*)?$/);
      if (match) {
        quantity = parseInt(match[1], 10);
        name = match[2].trim();
        if (match[3]) set = match[3];
        if (match[4]) collectorNumber = match[4];
        if (match[5]) isFoil = true;
      } else {
        // Try alternative Moxfield format that might have special characters in the card name
        match = cleanLine.match(/^(\d+)\s+([^(]+)(?:\s+\(([A-Z0-9]{3,4})\))?(?:\s+(\d+[a-z]?s?))?(\s+\*F\*)?$/);
        if (match) {
          quantity = parseInt(match[1], 10);
          name = match[2].trim();
          if (match[3]) set = match[3];
          if (match[4]) collectorNumber = match[4];
          if (match[5]) isFoil = true;
        } else {
          return null;
        }
      }
    } else {
      // Generic parsing: assume "1 Card Name"
      match = cleanLine.match(/^(\d+)\s+(.+?)$/);
      if (match) {
        quantity = parseInt(match[1], 10);
        name = match[2].trim();
      } else {
        return null;
      }
    }

    // Check for double-faced cards (format: "Card Name // Other Side")
    if (name.includes('//')) {
      // Keep the full name with both sides for double-faced cards
      // Store the full card name for identification
      // but remove any extra whitespace around the // separator
      name = name.replace(/\s*\/\/\s*/, ' // ');
    }

    return {
      quantity,
      name,
      ...(set && { set }),
      ...(collectorNumber && { collectorNumber }),
      ...(isFoil && { isFoil })
    };
  }
}
