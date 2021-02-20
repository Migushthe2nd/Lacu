const commando = require("discord.js-commando");

module.exports = class StopCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "stop",
            group: "controls",
            memberName: "stop",
            description: "Stop what's currently playing.",
            examples: ["stop"],
            guildOnly: true,
        });
    }

    run = async (message) => {
        if (message.guild.player) {
            if (message.guild.player.status === "playing" || message.guild.player.status === "paused") {
                message.channel.send("The player is being stopped...");
                await message.guild.player.stop();
            } else if (message.guild.player.status === "loading") {
                message.channel.send("Something is already being stopped.");
            }
            return;
        }

        message.channel.send("Nothing is playing yet.");
    };

};
