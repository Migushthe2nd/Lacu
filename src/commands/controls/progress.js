const commando = require("discord.js-commando");

module.exports = class ProgressCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "progress",
            aliases: ["time", "position"],
            group: "controls",
            memberName: "progress",
            description: "Indicates the current position in the video.",
            guildOnly: true
        });
    }

    run = async (message) => {
        if (message.guild.player) {
            if ((message.guild.player.status === "playing" || message.guild.player.status === "paused")) {
                message.channel.send(message.guild.player.getProgressEmbed());
                return;
            }
        }
        message.channel.send("Nothing is playing yet.");
    };

};
