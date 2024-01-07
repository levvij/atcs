import { createSocket } from "dgram";
import { Logger } from "../shared/log";
import { Message } from "../shared/message-parser";

export class Discovery {
	static readonly listeningAddress = 142;

	static acceptConnections() {
		const logger = new Logger('discovery');
		const server = createSocket('udp4');

		server.on('listening', () => {
			logger.log(`service discovery listening for broadcasts to :${this.listeningAddress}`);
		});
		
		server.on('message', (data, remote) => {
			const requestLogger = logger.child(`${remote.address}:${remote.port}`);
			requestLogger.log(`service discovery request received`);
			
			// only login requests should be handled
			try {
				const request = Message.from(data);

				if (!request.routes('login')) {
					throw new Error(`Invalid login route: ${request.route}`);
				}

				const deviceIdentifier = request.headers.device;

				if (!deviceIdentifier) {
					throw new Error('No device identifier supplied in login request');
				}
				
				requestLogger.log(`login from ${deviceIdentifier}`);

				const response = new Message(['connect'], {
					version: '1'
				});
				
				server.send(response.toBuffer(), remote.port, remote.address, (error) => {
					if (error) console.error(error);
					console.log('Sent response to client');
				});
			} catch {
				requestLogger.log(`invalid service discovery request`);
			}
		});
		
		server.bind(this.listeningAddress);
	}
}