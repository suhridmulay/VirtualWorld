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
        while (s[0].getTime() < now.getTime()) {
            currVid = s[1]
            i = i + 1;
        }
        return currVid;
    }

    schedule(time: Date, videoSource: string) {
        this._schedule.push([time, videoSource])
        this._schedule.sort((s1, s2) => s1[0].getTime() - s2[0].getTime())
        console.log(`Added video at ${time} from ${videoSource}`)
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