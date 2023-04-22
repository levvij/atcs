import { readFileSync, writeFileSync } from "fs";
import { DOMParser } from 'xmldom';

import { Area } from "./area.js";
import { PowerDistrict } from "./power-district.js";
import { Section } from "./section.js";
import { Track } from "./track.js";
import { Router } from "./router.js";
import { Route } from "./route.js";

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
		
		let area = railway.firstChild;
		
		while (area) {
			if (area.tagName == 'area') {
				this.areas.push(this.loadArea(area));
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
			dot += area.toDot();
		}
		
		writeFileSync('layout.dot', `${dot}}`);
	}
	
	loadArea(source, parent?: Area) {
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
			
			if (child.tagName == 'next') {
				const routerName = child.getAttribute('router');
				
				if (routerName) {
					const router = new Router(routerName, area);
					
					section.next = router;
				} else {
					
				}
			}
			
			child = child.nextSibling;
		}
	}
	
	linkSection(source, section: Section) {
		let child = source.firstChild;
		
		while (child) {
			if (child.tagName == 'next') {
				if (child.getAttribute('route')) {
					const next = this.findSectionOrRouter(child.getAttribute('section'), section.area);
					
					if (next instanceof Section) {
						const router = new Router(child.getAttribute('router'), section.area);
						
						section.next = new Route(child.getAttribute('route'), next, section, router);
						router.routes.push(section.next);
					} else {
						section.next = next.routes.find(route => route.name == child.getAttribute('route'))!;	
					}
				} else if (child.getAttribute('router')) {
					let route = child.firstChild;
					
					while (route) {
						if (route.tagName == 'route') {
							const router = section.next as Router;
							
							router.routes.push(new Route(
								route.getAttribute('name'), 
								section, 
								this.findSection(route.getAttribute('section'), section.area),
								router
							));
						}
						
						route = route.nextSibling;
					}
				} else {
					section.next = this.findSectionOrRouter(child.getAttribute('section'), section.area)!;
				}
			}
			
			child = child.nextSibling;
		}
	}
	
	findSection(path: string, base: Area) {
		const localSection = base.sections.find(section => section.name == path);
		
		if (localSection) {
			return localSection;
		}
		
		throw `section '${path}' not found from '${base.name}'`;
	}
	
	findSectionOrRouter(path: string, base: Area) {
		const localSection = base.sections.find(section => section.name == path);
		
		if (localSection) {
			return localSection;
		}
		
		const localRoute = base.routers.find(router => router.name == path);
		
		if (localRoute) {
			return localRoute;
		}
		
		throw `section or route '${path}' not found from '${base.name}'`;
	}
	
	loadRouter(source, area: Area) {
		const router = new Router(source.getAttribute('name'), area);
		
		return router;
	}
	
	linkRouter(source, router: Router) {
		let child = source.firstChild;
		
		while (child) {
			if (child.tagName == 'route') {
				const parent = router.parent as Area;
				
				const route = new Route(
					child.getAttribute('name'), 
					this.findSection(child.getAttribute('source'), parent),
					this.findSection(child.getAttribute('destination'), parent),
					router
				);
				
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