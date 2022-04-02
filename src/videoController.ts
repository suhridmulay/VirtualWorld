export class VideoController {
    _target: HTMLVideoElement

    _schedule: [Date, string][]

    constructor(target: HTMLVideoElement) {
        this._target = target
        this._schedule = []
    }

    getScheduledVideo() {
        const now = new Date()
        let currVid = ''
        let i = 0;
        let s = this._schedule[i];
        let prev = s;
        while (i < this._schedule.length && s[0].getTime() < now.getTime()) {
            currVid = s[1]
            i = i + 1;
            prev = s;
            s = this._schedule[i];
        }
        console.log(prev)
        return {time: prev[0], src: prev[1]};
    }

    schedule(time: Date, videoSource: string) {
        this._schedule.push([time, videoSource])
        // this._schedule = this._schedule.sort((s1, s2) => new Date(s1[0]).getTime() - new Date(s2[0]).getTime())
    }

    play() {
        if (this._target.paused || this._target.currentTime == 0) {
            this._target.play
        }
    }

    pause() {
        if (!this._target.paused) {
            this._target.pause()
        }
    }
}