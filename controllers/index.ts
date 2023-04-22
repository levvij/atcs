import { DetectController } from './detect.js';
import { SystemController } from './system.js';

export class RootController {
	detect = new DetectController();
	system = new SystemController();
}