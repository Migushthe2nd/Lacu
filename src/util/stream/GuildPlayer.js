const Streamer = require("./Streamer");
const youtubedl = require("youtube-dl");
const puppeteer = require("puppeteer");
const {currStatus} = require("./embeds");
const {nowPlaying, currProgress} = require("./embeds");
const {Hub, sseHub} = require("@toverux/expresse");

String.prototype.toSeconds = function () {
    if (!this) return null;
    let hms = this.split(":");
    if (hms.length === 3) {
        return (+hms[0]) * 60 * 60 + (+hms[1]) * 60 + (+hms[2]);
    } else {
        return (+hms[0]) * 60 + (+hms[1]);
    }
};

const removeRoute = (app, path) => {
    const routes = app._router.stack;
    routes.forEach(removeMiddlewares);

    function removeMiddlewares(route, i, routes) {
        if (route.route && route.route.path === path) {
            routes.splice(i, 1);
        }
    }
};

const singleStream = false;

module.exports = class GuildPlayer {
    hasStartedOnce;
    hasReported;
    argument;
    message;
    author;
    guild;
    status = "idle";
    data;
    progress;
    stream;
    seekString;
    seekSeconds = 0;

    constructor(message, argument) {
        this.argument = argument;
        this.message = message;
        this.author = this.message.author;
        this.guild = this.message.guild;

        // Create new see route
        this.sseHub = new Hub();
        this.expressApp = this.message.client.expressApp;
        this.expressApp.get(
            `/events/${this.guild.id}`,
            sseHub({hub: this.sseHub}),
            (req, res) => {
                if (this.info) {
                    res.sse.event("start", {info: this.info, guildName: this.guild.name});
                } else {
                    res.sse.event("idle", true);
                }
                if (this.data && this.progress) {
                    this.sseHub.event("progress", {
                        durationString: this.data.durationString,
                        durationSeconds: this.data.durationSeconds,
                        positionSeconds: this.progress.positionSeconds,
                        positionString: this.progress.positionString
                    });
                }
            }
        );
    }

    async init() {
        this.status = "loading";
        this.message.client.user.lockActivity = true;
        const busyMessage = await this.message.channel.send("Zoeken...");
        return new Promise(async (resolve, reject) => {
            try {
                const fetched = await this.fetchInfo(this.argument);

                if (fetched.formats && fetched.formats.length > 0) {
                    fetched.urls = {};

                    if (fetched.formats.length > 1) {
                        // Sort formats -------------
                        // Sort by bitrate
                        fetched.formats.sort((a, b) => {
                            return b["tbr"] - a["tbr"];
                        });

                        const videos = fetched.formats.filter((f) => f.vcodec && f.vcodec !== "none" && f.vcodec.startsWith("avc1") && f.height && f.height <= 1080);
                        const audios = fetched.formats.filter((f) => f.acodec && f.acodec !== "none");

                        fetched.urls.video = videos[0].url;
                        fetched.urls.audio = audios[0].url;
                    } else {
                        fetched.urls.video = fetched.formats[0].url;
                    }

                    this.info = fetched;
                    this.streamer = this.createStreamer();

                    await busyMessage.delete();
                    resolve();
                } else {
                    try {
                        this.info = await this.scrapePage(this.argument, fetched.referer);
                        await busyMessage.edit(`Ik heb wat gevonden!`);
                        // Could use a recursive loop here
                        this.streamer = this.createStreamer();
                        await busyMessage.edit(`Nu aan het spelen: \`${this.argument}\``);
                        resolve();
                    } catch (reason) {
                        return reason;
                    }
                }
            } catch (reason) {
                await busyMessage.edit(reason);
                this.reset(true);
                reject(reason);
            }
        });
    }

    async fetchInfo(argument) {
        return new Promise((resolve, reject) => {
            let urlObj;
            try {
                urlObj = new URL(argument);
            } catch (e) {
            }

            const ytdlArgs = ["--http-chunk-size=5M"];
            if (!singleStream) {
                ytdlArgs.push("-f best");
            }
            if (!!urlObj) {
                ytdlArgs.push(`--add-header='referer: ${urlObj.origin}'`);
            }

            youtubedl.getInfo(!!urlObj ? argument : `ytsearch1:${argument}`, ytdlArgs,
                async function (err, info) {
                    if (err) {
                        // Couldn't find the video
                        console.error(err);
                        if (!!urlObj) {
                            resolve({referer: urlObj.referer});
                        } else {
                            reject("An error has occurred. Try again later. This URL may not be supported.");
                        }
                    } else {
                        if (!!urlObj) {
                            let referer = urlObj.origin;
                            if (urlObj.host.includes("bunny.sh")) {
                                referer = "https://twist.moe/";
                            }
                            resolve({...info, referer});
                        } else {
                            resolve(info);
                        }
                    }
                });
        });
    }

    async scrapePage(url) {
        // Normal webpage. Try to capture media url using a headless browser.
        return new Promise(async (resolve, reject) => {
            try {
                const browser = await puppeteer.launch({headless: true});
                const page = await browser.newPage();
                await page.setJavaScriptEnabled(true);

                await page.goto(url);

                await page.setRequestInterception(true);

                const foundUrls = [];
                page.on("request", (request) => {
                    if (request.resourceType() === "media") {
                        console.log(request.url());
                        if (!foundUrls.includes(request.url())) {
                            foundUrls.push(request.url());
                        }
                    }
                    request.continue();
                });

                await page.click("body");
                await page.waitFor(10000);
                await page.click("body");

                if (foundUrls.length > 0 && !foundUrls[0].toLowerCase().includes("trailer")) {
                    if (foundUrls.length > 1 && foundUrls[0].toLowerCase().includes("trailer")) {
                        const referer = new URL(foundUrls[1]).origin;
                        resolve({url: foundUrls[1], referer});
                    } else {
                        const referer = new URL(foundUrls[0]).origin;
                        resolve({url: foundUrls[0], referer});
                    }
                } else {
                    reject("I couldn't find a video unfortunately. ");
                }
                await browser.close();
            } catch (e) {
                console.error(e);
                reject("An error has occurred. Try again later. This URL may not be supported.");
            }
        });
    }

    createStreamer() {
        return new Streamer(this.guild.id, this.info.urls, this.info.referer);
    }

    start() {
        this.status = "loading";
        this.message.client.clearLeaveTimer(this.guild);
        this.hasReported = false;
        this.hasReportedEnded = false;
        this.streamer.start((ffmpeg, callback) => {
            ffmpeg.on("start", async (commandLine) => {
                console.info("Internal playback started.");
                console.info("Command:", commandLine);
                this.status = "playing";

                this.sseHub.event("start", {info: this.info, guildName: this.guild.name});

                if (!this.hasStartedOnce && !this.hasReported) {
                    await this.message.channel.send(this.getNowPlayingEmbed());
                    this.hasStartedOnce = true;
                    this.hasReported = true;

                    // Show status on Discord
                    if (this.guild.id === process.env.MASTER_GUILD_ID) {
                        await this.message.client.user.setActivity(this.info.title, {
                            type: "WATCHING",
                            url: `https://live.lacu.tk/?id=${this.guild.id}&player=flv&site=https://youtube.com/`
                        });
                    }
                }
            });

            ffmpeg.on("error", (err) => {
                console.info(`Internal playback exited.`);

                if (!err.message.includes("SIGKILL")) {
                    // Unintentional, report error
                    console.error(err);
                    this.sseHub.event("errorEnd", true);
                    this.message.channel.send("Oops! An error occurred during playback. This could be a problem with the encoding." + (this.progress ? `\nLast known position: \`${this.progress.positionString}\`` : ""));
                    this.reset(true);
                } else {
                    this.sseHub.event("end", true);
                }
            });

            ffmpeg.on("end", async () => {
                console.info(`Internal playback finished.`);

                if (!this.hasReportedEnded) {
                    this.hasReportedEnded = true;
                    await this.message.channel.send("The video has ended.");
                    this.message.client.startLeaveTimer(this.guild);

                    this.sseHub.event("end", true);
                    this.reset(true);
                }
            });

            ffmpeg.on("codecData", (data) => {
                this.data = data;
                this.data.durationString = this.data.duration.substr(0, 8);
                this.data.durationSeconds = this.data.durationString.toSeconds();
            });

            ffmpeg.on("progress", async (progress) => {
                if (!this.hasReportedEnded) {
                    this.progress = progress;
                    this.progress.positionSeconds = this.progress.timemark.substr(0, 8).toSeconds() + this.seekSeconds;
                    this.progress.positionString = new Date(this.progress.positionSeconds * 1000).toISOString().substr(11, 8);

                    if (this.hasStartedOnce && !this.hasReported) {
                        await this.message.channel.send(this.getProgressEmbed());
                        this.hasReported = true;
                    }
                    if (this.progress.positionSeconds === this.data.durationSeconds && !this.hasReportedEnded) {
                        this.hasReportedEnded = true;
                        await this.message.channel.send("The video has ended.");
                        this.message.client.startLeaveTimer(this.guild);
                        await this.stop(true);
                    }

                    if (this.data && this.progress) {
                        this.sseHub.event("progress", {
                            durationString: this.data.durationString,
                            durationSeconds: this.data.durationSeconds,
                            positionSeconds: this.progress.positionSeconds,
                            positionString: this.progress.positionString
                        });
                    }
                }
            });

            callback();
        });
    }

    pause() {
        this.status = "paused";
        this.sseHub.event("pause", true);
        this.message.client.startLeaveTimer(this.guild, 60 * 60 * 1000);
        this.streamer.pause();
    }

    resume() {
        this.status = "playing";
        this.sseHub.event("resume", true);
        this.message.client.clearLeaveTimer(this.guild);
        this.streamer.resume();
    }

    async seek(position) {
        this.seekString = position;

        if (position.startsWith("+") || position.startsWith("-")) {
            this.seekSeconds = this.progress.positionSeconds + Number(position);
        } else if (!isNaN(position)) {
            this.seekSeconds = Number(position);
        } else if (position.includes(":")) {
            this.seekSeconds = position.toSeconds();
        } else {
            this.message.channel.send("Unknown timestamp format. Try `help seek` for more info.");
            return;
        }

        await this.reload(this.seekSeconds);
    }

    async loop(count) {
        this.streamer.loop(count);
        await this.reload(this.progress.positionSeconds);
    }

    async reload(resumeAt) {
        await this.stop(false);
        if (!isNaN(resumeAt)) {
            this.streamer.seek(resumeAt);
        }
        this.start();
    }

    async restart() {
        await this.stop(true);
        this.start();
    }

    async stop(hard) {
        if (this.streamer && this.streamer.ffmpeg) {
            this.status = "loading";
            return new Promise((resolve) => {
                const timer = setTimeout(() => {
                    this.reset(hard);
                }, 2000);
                this.streamer.stop(() => {
                    clearTimeout(timer);
                    this.reset(hard);
                    resolve();
                });
            });
        }
    }

    async exit() {
        await this.stop(true);
        removeRoute(this.expressApp, `/events/${this.guild.id}`);
    }

    async update(message, argument) {
        await this.stop(true);
        this.argument = argument;
        this.message = message;
        this.author = this.message.author;
        await this.init();
        this.start();
    }

    reset(hard) {
        this.message.client.user.lockActivity = false;
        this.status = "idle";
        delete this.progress;
        delete this.data;
        if (hard) {
            delete this.info;
            this.hasStartedOnce = false;
            this.hasReportedEnded = false;
            this.hasReported = false;
            delete this.seekString;
            this.seekSeconds = 0;
        }
    }

    getProgressEmbed() {
        return currProgress(this.info, this.progress, this.data);
    }

    getStatusEmbed() {
        return currStatus(this.info, this.progress, this.data, this.status);
    }

    getNowPlayingEmbed() {
        return nowPlaying(this.guild.id, this.info);
    }

};