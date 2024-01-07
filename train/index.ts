import { Tile } from "../layout/tile";
import { SectionPosition } from "./postion";

export class Train {
    head: SectionPosition;
    length: number;

    speed: number;

    trail() {
        return this.head.section.trail(this.head.offset, !this.head.reversed, this.length);
    }

    // time in seconds
    advance(time: number) {
        const distance = time * this.speed;

        this.head.advance(distance);
    }

    toSVG() {
        const trail = this.trail();

        const tiles: Tile[] = [];

        let start = 0;
        let end = 0;

        let length = 0;

        for (let sectionIndex = 0; sectionIndex < trail.sections.length; sectionIndex++) {
            const section = trail.sections[sectionIndex];

            const range = section.getTilesInRange(this.head, trail.tip);

            if (sectionIndex == 0) {
                start = range.offset.start;
            } else if (sectionIndex == trail.sections.length - 1) {
                end = range.offset.end;
            }
            
            for (let tile of range.tiles) {
                length += tile.pattern.length;
            }

            tiles.unshift(...range.tiles);
        }

        const tip = tiles[tiles.length - 1];

        return `
            <g id="train">
                <style>

                    g#train path {
                        stroke: blue;
                        stroke-dasharray: 0 ${start} ${length - end - start};

                        start: ${start};
                        end: ${end};
                    }

                </style>

                <text x="${tip.x}" y="${tip.y}" font-size="1">
                    TRAIN
                </text>

                <path d="${tiles.map((tile, index) => tile.toSVGPath(index != 0)).join(', ')}" />
            </g>
        `;
    }
}