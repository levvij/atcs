import { SectionPosition } from "../shared/postion";
import { District } from "./district";
import { PowerDistrict } from "./power-district";
import { Route } from "./route";
import { Tile } from "./tile";
import { Track } from "./track";

export class Section {
	powerDistrict: PowerDistrict;
	
	tracks: Track[] = [];
	tiles: Tile[] = [];
	
	in?: Route | Section;
	out?: Route | Section;
	
	constructor(
		public name: string,
		public district: District
	) {}

	get domainName() {
		return `${this.name}.${this.district.domainName}`;
	}

	// returns the next currently set section
	next(reverse: boolean) {
		if (reverse) {
			if (!this.in) {
				return null;
			}

			if (this.in instanceof Section) {
				return this.in;
			}

			if (this.in instanceof Route) {
				if (this.in.in == this) {
					return this.in.out;
				}

				return this.in.in;
			}
		} else {
			if (!this.out) {
				return null;
			}

			if (this.out instanceof Section) {
				return this.out;
			}

			if (this.out instanceof Route) {
				if (this.out.in == this) {
					return this.out.out;
				}

				return this.out.in;
			}
		}
	}

	getTilesInRange(startPosition: SectionPosition, endPosition: SectionPosition) {
		if (startPosition.section != this && endPosition.section != this) {
			return {
				offset: {
					start: 0,
					end: this.tiles[this.tiles.length - 1].pattern.length
				},
			
				tiles: [...this.tiles]
			};
		}

		let start = 0;
		let end = this.length;
		
		// only use the position limit if it is within our section
		if (startPosition.section == this) {
			end = startPosition.absolutePosition;
		}

		if (endPosition.section == this) {
			start = endPosition.absolutePosition;
		}

		// flip if the range was reversed
		if (end < start) {
			const small = end;

			end = start;
			start = small;
		}

		let passed = 0;
		const tiles: Tile[] = [];

		const tileUnitLength = this.length / this.tileLength;

		const offset = {
			start: 0,
			end: 0
		};

		for (let tile of this.tiles) {
			const length = tile.pattern.length * tileUnitLength;

			if (start - length <= passed && end + length >= passed) {
				tiles.push(tile);

				if (start <= passed) {
					offset.start = (start + length - passed) * tile.pattern.length / length;
				}
	
				if (end >= passed) {
					offset.end = 0.5; // (start + length - passed) * tile.pattern.length / length;
				}
			}

			passed += length;
		}
		
		return {
			offset,
			tiles
		};
	}
	
	dump() {
		console.group(`Section ${this.domainName}`);
		
		console.log('in', this.in?.name ?? 'buffer');
		console.log('out', this.out?.name ?? 'buffer');
		
		console.group(`tracks`);
		
		for (let track of this.tracks) {
			track.dump();
		}
		
		console.groupEnd();
		console.groupEnd();
	}
	
	get length() {
		return this.tracks.reduce((accumulator, track) => accumulator + track.length, 0);
	}

	get tileLength() {
		return this.tiles.reduce((accumulator, tile) => accumulator + tile.pattern.length, 0);
	}

	// follow the active path ahead (reverse = true = back)
	// uses the currently set routes
	// returns all touched sections
	trail(offset: number, reversed: boolean, length: number) {
		let tip: Section = this;
		const sections: Section[] = [this];

		if (reversed) {
			length -= offset;
		} else {
			length -= this.length - offset;
		}

		while (length > 0) {
			let next: Route | Section | undefined;

			if (reversed) {
				next = tip.in;
			} else {
				next = tip.out;
			}

			if (!next) {
				return {
					sections,

					tip: new SectionPosition(tip, tip.length, false)
				};
			}

			if (next instanceof Section) {
				tip = next;
			}

			if (next instanceof Route) {
				if (!next.router.activeRoute) {
					throw new Error(`Router '${next.router.domainName}' has no active route (routes: ${next.router.routes.map(route => `'${route.name}'`).join(', ')})`);
				}

				// TODO: handle flipped cases
				if (reversed) {
					tip = next.router.activeRoute!.in;
				} else {
					tip = next.router.activeRoute!.out;
				}
			}

			sections.push(tip);
			length -= tip.length;
		}

		return {
			sections,

			tip: new SectionPosition(tip, reversed ? -length : tip.length + length, false)
		};
	}
	
	toDotReference() {
		return `section_${this.name.replace(/-/g, '_')}_${this.district.toDotReference()}`;
	}
	
	toDotDefinition() {
		return `
			${this.toDotReference()} [ label = ${JSON.stringify(`${this.name}\n${this.length}`)}, shape = box ]
		`;
	}
	
	toDotConnection() {
		return `
			${this.out instanceof Section ? `${this.toDotReference()} -> ${this.out.toDotReference()}` : ''}
		`;
	}

	toSVG() {
		return `
			<g id=${JSON.stringify(this.domainName).split('.').join('_')}>
				<style>

					g#${this.domainName.split('.').join('_')} path {
						stroke: hsl(${(this.length / this.tileLength)}deg, 100%, 50%);
					}

				</style>

				${this.tiles.map(tile => tile.toSVG()).join('')}
			</g>
		`;
	}

	findSVGPositions() {
		return this.tiles.map(tile => ({ 
			x: tile.x,
			y: tile.y
		}));
	}
}