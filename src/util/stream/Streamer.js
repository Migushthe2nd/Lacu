const FfmpegCommand = require("fluent-ffmpeg");

module.exports = class Streamer {
    guildId;
    urls;
    referer;
    isHls;
    customInputArgs = [];
    customOutputArgs = [];
    startPos = 0;
    ffmpeg;

    constructor(guildId, urls, referer) {
        this.guildId = guildId;
        this.urls = urls;
        this.referer = referer;
        this.isHls = urls.video.endsWith("m3u8");
    }

    buildCommand() {
        const command = new FfmpegCommand();

        const inputArgs = ["-re"].concat(this.customInputArgs);
        if (this.isHls) {
            command.input(`hls+${this.urls.video}`);
        } else {
            command.input(this.urls.video);
            if (this.referer) {
                inputArgs.push(`-headers referer:${this.referer}`);
            }
        }
        command.seekInput(this.startPos);
        command.inputOptions(inputArgs);


        if (this.urls.audio) {
            command.input(`${this.urls.audio}`);
            command.seekInput(this.startPos);
            command.inputOptions(inputArgs);
        }

        const outputArgs = [
            //     "-loop", "-1",
            //     "-preset", "veryfast",
            //     "-tune", "zerolatency",
            //     "-max_delay", "0",
            //     `-speed ${speed}`
            "-strict -2",
            "-flvflags no_duration_filesize"
            // "-map 0:v:0"
            // "-deadline realtime"
        ].concat(this.customOutputArgs);
        command.outputOptions(outputArgs);

        command.videoCodec("copy");
        command.audioCodec("aac");
        command.audioBitrate("160k");
        command.audioFrequency(44100);

        command.format("flv");
        command.output(`rtmp:${process.env.INTERNAL_IP}/streams/${this.guildId}`);

        return command;
    }

    start(callback) {
        this.ffmpeg = this.buildCommand();
        callback(this.ffmpeg, () => {
            this.ffmpeg.run();
        });
    }

    pause() {
        this.ffmpeg.kill("SIGSTOP");
    }

    resume() {
        this.ffmpeg.kill("SIGCONT");
    }

    seek(value) {
        this.startPos = value;
    }

    loop(value) {
        this.customInputArgs.push(`-stream_loop ${value || -1}`);
    }

    // speed(value) {
    //     this.customInputArgs.push(`-speed ${value || 1}`);
    // }

    stop(callback) {
        let hasCalled = false;
        const forceStop = setTimeout(() => {
            callback();
            delete this.ffmpeg;
            hasCalled = true;
        }, 3000);
        this.ffmpeg.on("error", () => {
            if (!hasCalled) {
                clearTimeout(forceStop);
                callback();
                delete this.ffmpeg;
            }
        });
        this.ffmpeg.kill();
    }

};