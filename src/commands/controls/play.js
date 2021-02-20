const commando = require("discord.js-commando");
const GuildPlayer = require("../../util/stream/GuildPlayer");

module.exports = class PlayCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "play",
            aliases: ["stream", "start"],
            group: "controls",
            memberName: "play",
            description: "Play a video via its url.",
            examples: ["play https://www.youtube.com/watch?v=U7L-3VXAkSA", "play https://example.com/video.mp4", "stream Mine Diamonds"],
            guildOnly: true,

            args: [
                {
                    key: "argument",
                    prompt: "What do you want to play? Enter a search query for YouTube or enter a URL.",
                    type: "string"
                }
            ]
        });
    }

    run = async (message, {argument}) => {
        try {
            if (message.guild.player) {
                if (message.guild.player.status !== "loading") {
                    // Add queueing feature
                    await message.guild.player.update(message, argument);
                } else {
                    message.channel.send("Something is already loading.");
                }
            } else {
                message.guild.player = new GuildPlayer(message, argument);
                await message.guild.player.init();
                message.guild.player.start();
            }

            // Connect to voice channel
            const voiceChannel = await message.member.voice.channel;
            if (voiceChannel) {
                voiceChannel.join()
                    .then(() => {
                        message.guild.me.voice.setDeaf(true);
                        message.guild.me.voice.setMute(false);
                    })
                    .catch(console.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

};
