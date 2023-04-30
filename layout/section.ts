import { Area } from "./area.js";
import { PowerDistrict } from "./power-district.js";
import { Route } from "./route.js";
import { Tile } from "./tile.js";
import { Track } from "./track.js";

export class Section {
	powerDistrict: PowerDistrict;
	
	tracks: Track[] = [];
	tiles: Tile[] = [];
	
	in?: Route | Section;
	out?: Route | Section;
	
	constructor(
		public name: string,
		public area: Area
	) {}

	get domainName() {
		return `${this.name}.${this.area.domainName}`;
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
	
	toDotReference() {
		return `section_${this.name.replace(/-/g, '_')}_${this.area.toDotReference()}`;
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