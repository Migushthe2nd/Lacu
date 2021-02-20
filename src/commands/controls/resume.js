const commando = require("discord.js-commando");

module.exports = class ResumeCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "resume",
            aliases: ["hervat", "start"],
            group: "controls",
            memberName: "resume",
            description: "Resume what was already playing.",
            examples: ["start", "resume"],
            guildOnly: true
        });
    }

    run = async (message) => {
        if (message.guild.player) {
            if (message.guild.player.status === "playing") {
                message.channel.send("The video is already playing.");
                return;
            } else if (message.guild.player.status === "paused") {
                message.channel.send("The video is being resumed...");
                message.guild.player.resume();
                return;
            }
            message.channel.send("Something is already loading.");
            return;
        }

        message.channel.send("Nothing is playing yet.");
    };

};
