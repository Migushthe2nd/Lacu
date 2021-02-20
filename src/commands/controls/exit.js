const commando = require("discord.js-commando");

module.exports = class ExitCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "exit",
            aliases: ["leave"],
            group: "controls",
            memberName: "exit",
            description: "Stop the stream completely and release me from my misery. ",
            examples: ["exit"],
            guildOnly: true
        });
    }

    run = async (message) => {
        if (message.guild.player) {
            if (message.guild.player.status !== "loading") {
                if (message.guild.player.streamer) {
                    await message.guild.player.exit();
                    delete message.guild.player;
                    message.client.user.lockActivity = false;

                    // Leave the voice channel
                    const voiceChannel = await message.guild.me.voice.channel;
                    voiceChannel.leave();
                    message.channel.send("I closed the video player.");
                }
            } else {
                message.channel.send("Something else is still loading...");
            }
            return;
        }

        message.channel.send("I am not active yet.");
    };

};
