import { readFileSync, writeFileSync } from "fs";
import { DOMParser } from 'xmldom';

import { Area } from "./area.js";
import { PowerDistrict } from "./power-district.js";
import { Section } from "./section.js";
import { Track } from "./track.js";
import { Router } from "./router.js";
import { Route } from "./route.js";
import { Tile, TilePattern } from "./tile.js";

export class Layout {
	name: string;
	
	areas: Area[] = [];
	
	constructor(
		private path: string
	) {}
	
	load() {
		const content = readFileSync(this.path).toString();
		const document = new DOMParser().parseFromString(content) as any;
		
		const railway = document.firstChild!;
		this.name = railway.getAttribute('name');

		const version = railway.getAttribute('version');
		
		if (version == '1') {
			let area = railway.firstChild;
			
			while (area) {
				if (area.tagName == 'area') {
					this.areas.push(this.loadArea(area, this));
				}
				
				area = area.nextSibling;
			}
			
			area = railway.firstChild;
			let index = 0;
			
			while (area) {
				if (area.tagName == 'area') {
					this.linkArea(area, this.areas[index]);
					
					index++;
				}
				
				area = area.nextSibling;
			}
			
			for (let area of this.areas) {
				area.dump();
			}
			
			let dot = 'digraph G {';
			
			for (let area of this.areas) {
				dot += area.toDotDefinition();
			}
			
			for (let area of this.areas) {
				dot += area.toDotConnection();
			}
			
			writeFileSync('layout.dot', `${dot}}`);

			const positons = this.areas.map(area => area.findSVGPositions()).flat(Infinity);

			const width = Math.max(...positons.map(position => position.x));
			const height = Math.max(...positons.map(position => position.y));

			let svg = `<svg width="${width * 25}" height="${height * 25}" viewBox="0 0 ${width + 1} ${height + 1}" xmlns="http://www.w3.org/2000/svg">
				<style>

					path {
						fill: none;
						stroke: #000;
						stroke-width: 0.2;
					}

				</style>
			`;
			
			for (let area of this.areas) {
				svg += area.toSVG();
			}
			
			writeFileSync('layout.svg', `${svg}</svg>`);
		} else {
			throw `unsupported railway definition file version '${version}' in '${this.path}'`;
		}
	}
	
	loadArea(source, parent: Area | Layout) {
		const area = new Area(source.getAttribute('name'), parent);
		
		let child = source.firstChild;
		
		while (child) {
			if (child.tagName == 'power-districts') {
				let district = child.firstChild;
				
				while (district) {
					if (district.tagName == 'power-district') {
						area.powerDistricts.push(this.loadPowerDistrict(district, area));
					}
					
					district = district.nextSibling;
				}
			}
			
			if (child.tagName == 'section') {
				this.loadSection(child, area);
			}
			
			if (child.tagName == 'router') {
				area.routers.push(this.loadRouter(child, area));
			}
			
			if (child.tagName == 'area') {
				area.children.push(this.loadArea(child, area));
			}
			
			child = child.nextSibling;
		}
		
		return area;
	}
	
	linkArea(source, area: Area) {
		let child = source.firstChild;
		
		let sectionIndex = 0;
		let childIndex = 0;
		
		while (child) {
			if (child.tagName == 'section') {
				this.linkSection(child, area.sections[sectionIndex]);
				
				sectionIndex++;
			}
			
			if (child.tagName == 'router') {
				this.linkRouter(child, area.routers.find(router => router.name == child.getAttribute('name'))!);
			}
			
			if (child.tagName == 'area') {
				this.linkArea(child, area.children[childIndex]);
				
				childIndex++;
			}
			
			child = child.nextSibling;
		}
	}
	
	loadSection(source, area: Area) {
		const section = new Section(source.getAttribute('name'), area);
		area.sections.push(section);
		
		let child = source.firstChild;
		
		while (child) {
			if (child.tagName == 'tracks') {
				let track = child.firstChild;
				
				while (track) {
					if (track.tagName == 'track') {
						section.tracks.push(new Track(
							section, 
							+track.getAttribute('length'), 
							track.getAttribute('path')
						));
					}
					
					track = track.nextSibling;
				}
			}

			if (child.tagName == 'tile') {
				const pattern = child.getAttribute('pattern');

				if (!(pattern in TilePattern.patterns)) {
					throw `unknown tile pattern '${pattern}' in tile ${section.tiles.length + 1} in ${section.domainName}`;
				}

				section.tiles.push(new Tile(section, +child.getAttribute('x'), +child.getAttribute('y'), TilePattern.patterns[pattern]))
			}
			
			child = child.nextSibling;
		}
	}
	
	linkSection(source, section: Section) {
		let child = source.firstChild;
		
		while (child) {
			if (child.tagName == 'out') {
				const out = this.findSection(child.getAttribute('section'), section.area);
				
				section.out = out;
				out.in = section;
			}
			
			child = child.nextSibling;
		}
	}
	
	findSection(path: string, base: Area, source = base) {
		const parts = path.split('.');
		
		if (parts.length == 0) {
			throw `section '${path}' not found from '${source.name}': invalid name`;
		}
		
		if (parts.length == 1) {
			const localSection = base.sections.find(section => section.name == parts[0]);
			
			if (!localSection) {
				throw `section '${path}' not found from '${source.name}': section does not exist in '${base.name}'`;
			}
			
			return localSection;
		}
		
		const sectionName = parts.pop()!;
		
		let pool: Area | Layout = base;
		
		for (let index = 0; index < parts.length; index++) {
			if (pool instanceof Layout || !pool.parent) {
				throw `section '${path}' could not be found from '${source.name}': area '${pool.name}' does not have a parent`;
			}
			
			pool = pool.parent!;
		}
		
		for (let part of parts) {
			const child = (pool instanceof Area ? pool.children : pool.areas).find(child => child.name == part);
			
			if (!child) {
				throw `section '${path}' could not be found from '${source.name}': area '${pool.name}' does not have a child named '${part}'`;
			}
			
			pool = child;
		}

		if (pool instanceof Layout) {
			throw `section '${path}' could not be found from '${source.name}': a layout cannot directly include a section`;
		}
		
		return this.findSection(sectionName, pool, source);
	}
	
	loadRouter(source, area: Area) {
		const router = new Router(source.getAttribute('name'), area);
		
		return router;
	}
	
	linkRouter(source, router: Router) {
		let child = source.firstChild;
		
		while (child) {
			if (child.tagName == 'route') {
				const route = new Route(child.getAttribute('name'), router);
				
				route.in = this.findSection(child.getAttribute('in'), router.area);
				route.in.out = route;
				
				route.out = this.findSection(child.getAttribute('out'), router.area);
				route.out.in = route;
				
				router.routes.push(route);
			}
			
			child = child.nextSibling;
		}
	}
	
	loadPowerDistrict(source, area: Area) {
		const powerDistrict = new PowerDistrict(source.getAttribute('name'), area);
		
		return powerDistrict;
	}
}