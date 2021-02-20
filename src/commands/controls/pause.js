const commando = require("discord.js-commando");

module.exports = class PauseCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "pause",
            group: "controls",
            memberName: "pause",
            description: "Pause what's currently playing. ",
            examples: ["pause"],
            guildOnly: true
        });
    }

    run = async (message) => {
        if (message.guild.player) {
            if (message.guild.player.status === "playing") {
                message.guild.player.pause();
                message.channel.send("The video is being paused...");
                return;
            } else if (message.guild.player.status === "paused") {
                message.channel.send("The video has already been paused.");
                return;
            }
        }

        message.channel.send("Nothing is playing yet.");
    };

};
