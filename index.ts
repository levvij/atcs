import { readFileSync } from 'fs';
import { createServer } from 'net';
import { RootController } from './controllers/index.js';
import { CommandParser } from './parser.js';

process.stdout.write(`ACTS ${JSON.parse(readFileSync('package.json').toString()).version}\n`);

const commandLineInterface = new CommandParser(new RootController());
process.stdin.on('data', data => commandLineInterface.parse(data));

const server = createServer(socket => {
	const session = new CommandParser(new RootController());
	
	socket.on('data', data => session.parse(data));
	socket.on('error', error => console.warn('error in socket', error));
}).on('error', error => {
	console.log(error);
});

server.listen(141, () => {
  console.log('opened server on', server.address());
}); 