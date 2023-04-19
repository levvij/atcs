export class DetectController {
	magnet(source, { 
		direction, d,
		state, s
	} : { 
		direction: 'positive' | 'negative', d: 'p' | 'n', 
		state: boolean, s: 't' | 'f'
	}) {
		direction = direction || d == 'p' ? 'positive' : 'negative';
		state = state || s == 't';
		
		console.log(`+ balise ${source.id} ${direction} ${state ? 'OVER' : 'out'}`);
	}
}