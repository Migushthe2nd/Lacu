const commando = require("discord.js-commando");

module.exports = class StatusCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "status",
            group: "controls",
            memberName: "status",
            description: "Displays the current status of the player.",
            guildOnly: true
        });
    }

    run = async (message) => {
        if (message.guild.player) {
            message.channel.send(message.guild.player.getStatusEmbed());
            return;
        }

        message.channel.send("Nothing is playing yet.");
    };

};
