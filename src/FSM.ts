export class FSM {
    states: string[]
    transitionTable: {
        [key: string]: {
            [key: string]: string
        }
    }
    currentState: string;

    constructor(states: string[], currentState: string) {
        this.states = states;
        this.transitionTable = {}
        this.currentState = currentState;
    }

    addState(state: string) {
        this.states.push(state);
    }

    addTransition(from: string, action: string, to: string) {
        if (!this.states.includes(from)) {
            throw new Error(`State ${from} not a part of FSM`)
        }
        if (!this.states.includes(to)) {
            throw new Error(`State ${to} not a part of FSM`)
        }
        this.transitionTable[from][action] = to;
    }
}