import { Section } from './section.js';

export class TilePattern {
    // TODO: replace simple paths with rounded versions
    static patterns = {
        'tl-cc': new TilePattern(0.7, 'M 0 0, L 0.5 0.5'),
        'tc-cc': new TilePattern(0.5, 'M 0.5 0, L 0.5 0.5'),
        'tr-cc': new TilePattern(0.7, 'M 1 0, L 0.5 0.5'),
        'cl-cc': new TilePattern(0.5, 'M 0 0.5, L 0.5 0.5'),
        'cr-cc': new TilePattern(0.5, 'M 1 0.5, L 0.5 0.5'),
        'bl-cc': new TilePattern(0.7, 'M 0 1, L 0.5 0.5'),
        'bc-cc': new TilePattern(0.5, 'M 0.5 1, L 0.5 0.5'),
        'br-cc': new TilePattern(0.7, 'M 1 1, L 0.5 0.5'),

        'cc-tl': new TilePattern(0.7, 'M 0.5 0.5, L 0 0'),
        'cc-tc': new TilePattern(0.5, 'M 0.5 0.5, L 0.5 0'),
        'cc-tr': new TilePattern(0.7, 'M 0.5 0.5, L 1 0'),
        'cc-cl': new TilePattern(0.5, 'M 0.5 0.5, L 0 0.5'),
        'cc-cr': new TilePattern(0.5, 'M 0.5 0.5, L 1 0.5'),
        'cc-bl': new TilePattern(0.7, 'M 0.5 0.5, L 0 1'),
        'cc-bc': new TilePattern(0.5, 'M 0.5 0.5, L 0.5 1'),
        'cc-br': new TilePattern(0.7, 'M 0.5 0.5, L 1 1'),

        'cr-cl': new TilePattern(1, 'M 1 0.5, L 0 0.5'),
        'cr-tl': new TilePattern(1.2, 'M 1 0.5, L 0.5 0.5, L 0 0'),
        'cr-bl': new TilePattern(1.2, 'M 1 0.5, L 0.5 0.5, L 0 1'),
        
        'cl-cr': new TilePattern(1, 'M 0 0.5, L 1 0.5'),
        'cl-tr': new TilePattern(1.2, 'M 0 0.5, L 0.5 0.5, L 1 0'),
        'cl-bl': new TilePattern(1.2, 'M 0 0.5, L 0.5 0.5, L 1 1'),
        
        'tl-bc': new TilePattern(1.2, 'M 0 0, L 0.5 0.5, L 0.5 1'),
        'tl-br': new TilePattern(1.4, 'M 0 0, L 0.5 0.5, L 1 1'),
        'tl-cr': new TilePattern(1.2, 'M 0 0, L 0.5 0.5, L 1 0.5'),

        'tc-bc': new TilePattern(1, 'M 0.5 0, L 0.5 1'),
        'tc-br': new TilePattern(1.2, 'M 0.5 0, L 0.5 0.5, L 1 1'),
        'tc-bl': new TilePattern(1.2, 'M 0.5 0, L 0.5 0.5, L 0 1'),

        'tr-cl': new TilePattern(1.2, 'M 1 0, L 0.5 0.5, L 0 0.5'),
        'tr-bc': new TilePattern(1.2, 'M 1 0, L 0.5 0.5, L 0.5 1'),
        
        'bl-tr': new TilePattern(1.4, 'M 0 1, L 0.5 0.5, L 1 0'),
        'bl-tc': new TilePattern(1.2, 'M 0 1, L 0.5 0.5, L 0.5 0'),
        'bl-cr': new TilePattern(1.2, 'M 0 1, L 0.5 0.5, L 1 0.5'),

        'bc-tc': new TilePattern(1, 'M 0.5 1, L 0.5 0.5, L 0.5 0'),
        'bc-tr': new TilePattern(1.2, 'M 0.5 1, L 0.5 0.5, L 1 0'),
        'bc-tl': new TilePattern(1.2, 'M 0.5 1, L 0.5 0.5, L 0 0'),

        'br-cl': new TilePattern(1.2, 'M 1 1, L 0.5 0.5, L 0 0.5'),
        'br-tc': new TilePattern(1.2, 'M 1 1, L 0.5 0.5, L 0.5 0'),
       
        'br-tl': new TilePattern(1.4, 'M 1 1, L 0.5 0.5, L 0 0'),

        // oddities
        'cl-bc': new TilePattern(0.7, 'M 0 0.5, L 0.5 1')
    };

    constructor(
        public length: number,
        public path: string
    ) {}
}

export class Tile {
    constructor(
        public section: Section,

        public x: number,
        public y: number,

        public pattern: TilePattern
    ) {}

    toSVG() {
        return `
            <path transform="translate(${this.x}, ${this.y})" d="${this.pattern.path}" />
        `;
    }
}