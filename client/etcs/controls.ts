import { Train } from "../../shared/train";
import { LookAhead } from "./look-ahead";
import { Bridge } from "./bridge";

export class Controls {
	constructor(train: Train, lookahead: LookAhead) {
		onkeydown = e => {
			const key = e.key.toLowerCase();
			
			const nextTurnout = train.getNextControllableTurnout(lookahead.max);
			
			if (key != "r") {
				e.preventDefault();
			}
			
			switch (key) {
				case "w": {
					Bridge.updateAcceleration(train, Math.min(train.acceleration + 0.5, train.maxAcceleration))

					break;
				}
					
				case " ": {
					Bridge.updateAcceleration(train, Math.max(train.acceleration - 0.5, train.minAcceleration))

					break;
				}

				case "e": {
					Bridge.updateAcceleration(train, train.minAcceleration)
					
					break;
				}
				
				case "q": {
					Bridge.updateAcceleration(train, 0)
					
					break;
				}
					
				/*
					
				case "tab": {
					data.train.accelerateTo(0, null, data.train.getSafeDistance(data.train.safeBreakingDistance * 2));
					
					break;
				}
					
				case "capslock": {
					data.train.accelerateTo(data.speed.current.optimal, 0, data.train.viewingDistance);
					
					break;
				}
					
				case "shift": {
					data.train.accelerateTo(data.speed.current.optimal, 10);
					
					break;
				}
					
				case "control": {
					data.train.accelerateTo(data.speed.current.optimal, 30);
					
					break;
				}
					
				case "a": {
					if (nextTurnout && nextTurnout.turnout.left && nextTurnout.turnout.direction == data.train.location.direction) {
						nextTurnout.turnout.proposedState = "left";
					}
					
					break;
				}
					
				case "s": {
					if (nextTurnout && nextTurnout.turnout.middle && nextTurnout.turnout.direction == data.train.location.direction) {
						nextTurnout.turnout.proposedState = "middle";
					}
					
					break;
				}
					
				case "d": {
					if (nextTurnout && nextTurnout.turnout.right && nextTurnout.turnout.direction == data.train.location.direction) {
						nextTurnout.turnout.proposedState = "right";
					}
					
					break;
				}*/
					
				case "u": {
					lookahead.max = lookahead.steps[Math.min(lookahead.steps.length - 1, lookahead.steps.indexOf(lookahead.max) + 1)]
					
					break;
				}
					
				case "j": {
					lookahead.max = lookahead.steps[Math.max(0, lookahead.steps.indexOf(lookahead.max) - 1)];
					
					break;
				}
			}
		}
	}
}