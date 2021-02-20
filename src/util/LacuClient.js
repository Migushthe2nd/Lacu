const Discord = require("discord.js");
const Commando = require("discord.js-commando");
const Express = require("express");
const NodeMediaServer = require("node-media-server");

module.exports = class LacuClient extends Commando.Client {

    constructor(props) {
        // Create Client
        super(props);

        // Link Discord module to client
        this.Discord = Discord;

        // Create Node Media Server
        const app = Express();
        const config = {
            expressApp: app,
            logType: 1,
            rtmp: {
                port: 1935,
                chunk_size: 4096,
                gop_cache: true,
                ping: 30,
                ping_timeout: 60
            },
            http: {
                port: process.env.WEBSITE_PORT,
                allow_origin: process.env.WEBSITE_ORIGIN,
                mediaroot: "./assets/html",
                api: false
            }
        };
        this.expressApp = app;
        const nms = new NodeMediaServer(config);
        nms.run();

        this.monitorJoins();
        this.loopActivities();
    }

    startLeaveTimer = (guild, delay = 10 * 60 * 1000) => {
        guild.leaveTimer = setTimeout(async () => {
            const voiceChannel = await guild.me.voice.channel;
            voiceChannel.leave();
        }, delay);
    };

    clearLeaveTimer = (guild) => {
        clearTimeout(guild.leaveTimer);
    };

    monitorJoins = () => {
        this.on("guildCreate", (guild) => {
            guild.systemChannel.send(
                `Hi, I'm Lacu. I use patented new™ super™ protocols to provide for a great experience!`
            );
        });
    };

    loopActivities = () => {
        const activities_list = [
            {
                name: process.env.PREFIX + " help",
                type: "LISTENING"
            }
        ];

        this.on("ready", () => {
            console.log(`Logged in as ${this.user.tag}!`);
            let activityIndex = 0;
            setInterval(() => {
                if (!this.user.lockActivity) {
                    this.user.setActivity(activities_list[activityIndex].name, {
                        type: activities_list[activityIndex].type,
                        url: activities_list[activityIndex].url
                    });
                    if (activityIndex === activities_list.length - 1) {
                        activityIndex = 0;
                    } else activityIndex++;
                }
            }, 45000); // run this every 45 seconds.
        });
    };

};