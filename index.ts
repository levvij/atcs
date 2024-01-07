import { readFileSync, writeFileSync } from "fs";
import { Discovery } from "./discovery";
import { createServer } from "net";
import { RootController } from "./controllers";
import { Layout } from "./layout";
import { CommandParser } from "./parser";
import { Train } from "./train";
import { SectionPosition } from "./train/postion";

process.stdout.write(`ACTS ${JSON.parse(readFileSync('package.json').toString()).version}\n`);

// listen for devices on the network
Discovery.acceptConnections();

const layout = new Layout(process.env.LAYOUT_FILE_LOCATION);
layout.load();
layout.dump();

/*

// fake set all routes
for (let district of layout.allDistricts) {
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

setInterval(() => {
	train.advance(0.1);

	console.log(train.head.toString());

	const svg = layout.toSVG(train.toSVG());
	writeFileSync('layout.svg', svg);
}, 100);

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