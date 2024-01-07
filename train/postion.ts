import { Section } from '../layout/section.js';

export class SectionPosition {
    constructor(
        public section: Section,
        public offset: number,
        public reversed: boolean
    ) {}

    get absolutePosition() {
        if (this.reversed) {
            return this.section.length - this.offset;
        }

        return this.offset;
    }

    advance(distance: number) {
        if (this.offset + distance > this.section.length) {
            const next = this.section.next(this.reversed);

            if (!next) {
                throw `illegal advancement ${this} + ${distance}`;
            }

            this.offset = this.offset + distance - this.section.length;
            this.section = next;
        } else {
            this.offset += distance;
        }
    }

    toString() {
        return `${this.section.domainName} @ ${this.offset} ${this.reversed ? 'backward' : 'forward'}`;
    }
}