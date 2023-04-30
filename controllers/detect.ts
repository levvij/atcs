export class DetectController {
	magnet(source, { 
		direction, d,
		state, s
	} : { 
		direction: 'positive' | 'negative', d: 'p' | 'n', 
		state: 'true' | 'false', s: 't' | 'f'
	}) {
		direction = direction || d == 'p' ? 'positive' : 'negative';
		
		const down = state ? state == 'true' : s == 't';
		console.log(`+ balise ${source.id} ${direction} ${down ? 'OVER' : 'out'}`);
	}
}