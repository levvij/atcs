import { readFileSync } from 'fs';
import { createServer } from 'net';
import { RootController } from './controllers/index.js';
import { CommandParser } from './parser.js';
import { Layout } from './layout.js';

process.stdout.write(`ACTS ${JSON.parse(readFileSync('package.json').toString()).version}\n`);

const layout = new Layout('../kalkbreite.com/layout/index.rml');
layout.load();

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