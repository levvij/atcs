import { readFileSync, writeFileSync } from 'fs';
import { createServer } from 'net';
import { RootController } from './controllers/index.js';
import { CommandParser } from './parser.js';
import { Layout } from './layout/index.js';
import { Train } from './train/index.js';
import { SectionPosition } from './train/postion.js';
import { Discovery } from './discovery/index.js';

process.stdout.write(`ACTS ${JSON.parse(readFileSync('package.json').toString()).version}\n`);

// listen for devices on the network
Discovery.acceptConnections();

/*

const layout = new Layout('../kalkbreite.com/layout/index.rml');
layout.load();

// fake set all routes
for (let district of layout.alldistricts) {
	for (let router of district.routers) {
		router.activeRoute = router.routes[0];
	}
}

const train = new Train();

train.head = new SectionPosition(
	layout.districts
		.find(district => district.name == 'fiddle-yard-east')!.children
		.find(district => district.name == 'northbound')!.sections
		.find(section => section.name == 'stem-body')!, 
	450, 
	false
);

train.speed = 36;
train.length = 420;

// setInterval(() => {
	train.advance(0.1);

	console.log(train.head.toString());

	const svg = layout.toSVG(train.toSVG());
	writeFileSync('layout.svg', svg);
// }, 100);

const server = createServer(socket => {
	const session = new CommandParser(new RootController(), data => socket.write(data));
	
	socket.on('data', data => session.parse(data));
	socket.on('error', error => console.warn('error in socket', error));
}).on('error', error => {
	console.log(error);
});

server.listen(141, () => {
	process.stdout.write(`server on :141\n`);
	
	const commandLineInterface = new CommandParser(
		new RootController(), 
		data => process.stdout.write(data),
		path => process.stdout.write(`\nRTP ${new Date().toISOString()}${path ? ` ${path}` : ''} # `)
	);
	
	process.stdin.on('data', data => commandLineInterface.parse(data));
}); 

*/