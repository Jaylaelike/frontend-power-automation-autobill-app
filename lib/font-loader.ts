const jsPDF = require('jspdf').jsPDF;

// Font loading utility for PDF generation
export class FontLoader {
  private static fontCache: { [key: string]: string } = {};
  
  // Method to clear font cache if needed
  static clearCache(): void {
    this.fontCache = {};
    console.log('Font cache cleared');
  }
  
  // Method to check if fonts are cached
  static isFontCached(fontPath: string): boolean {
    return !!this.fontCache[fontPath];
  }
  
  // Method to preload all fonts
  static async preloadFonts(): Promise<void> {
    console.log('Preloading fonts...');
    try {
      await Promise.all([
        this.loadFont('/font/Sarabun-Regular.ttf'),
        this.loadFont('/font/Sarabun-Bold.ttf'),
        this.loadFont('/font/Sarabun-Medium.ttf')
      ]);
      console.log('All fonts preloaded successfully');
    } catch (error) {
      console.warn('Font preloading failed:', error);
    }
  }
  
  // Debug method to check font status
  static getFontStatus(): { [key: string]: boolean } {
    return {
      'Sarabun-Regular': this.isFontCached('/font/Sarabun-Regular.ttf'),
      'Sarabun-Bold': this.isFontCached('/font/Sarabun-Bold.ttf'),
      'Sarabun-Medium': this.isFontCached('/font/Sarabun-Medium.ttf')
    };
  }

  static async loadFont(fontPath: string, retries: number = 3): Promise<string> {
    if (this.fontCache[fontPath]) {
      console.log(`Using cached font: ${fontPath}`);
      return this.fontCache[fontPath];
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Loading font ${fontPath} (attempt ${attempt}/${retries})`);
        const response = await fetch(fontPath);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to load font: ${fontPath}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        this.fontCache[fontPath] = base64;
        console.log(`Successfully loaded and cached font: ${fontPath}`);
        return base64;
      } catch (error) {
        console.warn(`Attempt ${attempt} failed to load font ${fontPath}:`, error);
        if (attempt === retries) {
          console.error(`All ${retries} attempts failed for font ${fontPath}`);
          return '';
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
    return '';
  }

  static async setupFonts(doc: any): Promise<void> {
    try {
      // Always load fonts for each document instance, but use cache for font data
      const [regularFont, boldFont, mediumFont] = await Promise.all([
        this.loadFont('/font/Sarabun-Regular.ttf'),
        this.loadFont('/font/Sarabun-Bold.ttf'),
        this.loadFont('/font/Sarabun-Medium.ttf')
      ]);

      // Add fonts to this specific document instance
      if (regularFont) {
        doc.addFileToVFS('Sarabun-Regular.ttf', regularFont);
        doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
      }

      if (boldFont) {
        doc.addFileToVFS('Sarabun-Bold.ttf', boldFont);
        doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold');
      }

      if (mediumFont) {
        doc.addFileToVFS('Sarabun-Medium.ttf', mediumFont);
        doc.addFont('Sarabun-Medium.ttf', 'Sarabun', 'medium');
      }

      console.log('Fonts setup completed for document instance');
    } catch (error) {
      console.warn('Failed to setup fonts:', error);
      throw error; // Re-throw to handle in PDF generation
    }
  }

  static setFont(doc: any, weight: 'normal' | 'bold' | 'medium' = 'normal'): void {
    try {
      // Check if Sarabun font is available in this document
      const availableFonts = doc.getFontList();
      if (availableFonts.Sarabun && availableFonts.Sarabun.includes(weight)) {
        doc.setFont('Sarabun', weight);
        console.log(`Set font to Sarabun ${weight}`);
      } else {
        throw new Error(`Sarabun ${weight} not available in document`);
      }
    } catch (error) {
      // Fallback to default font if Sarabun is not available
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Sarabun font not available (${errorMessage}), using default font`);
      const fallbackWeight = weight === 'bold' ? 'bold' : 'normal';
      doc.setFont('helvetica', fallbackWeight);
      console.log(`Set fallback font to helvetica ${fallbackWeight}`);
    }
  }
}