const commando = require("discord.js-commando");

module.exports = class SeekCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "seek",
            group: "controls",
            memberName: "seek",
            description: "Seek to a specific time in the video.",
            examples: ["seek 120", "seek 12:21", "seek +300", "seek -20"],
            guildOnly: true,

            args: [
                {
                    key: "seekTime",
                    prompt: "To what time do you want or how much do you want seek forward/backward? ",
                    type: "string"
                }
            ]
        });
    }

    run = async (message, {seekTime}) => {
        if (message.guild.player) {
            if (message.guild.player.status === "playing" || message.guild.player.status === "paused") {
                await message.channel.send(`I'll go to \`${seekTime}\`...`);
                await message.guild.player.seek(seekTime);
                return;
            }
        }
        message.channel.send("Nothing is playing yet.");
    };

};
