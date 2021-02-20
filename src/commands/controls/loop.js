const commando = require("discord.js-commando");

module.exports = class SeekCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "loop",
            group: "controls",
            memberName: "loop",
            description: "Repeat a video x times or infinitely many times. ",
            examples: ["loop", "loop 4"],
            guildOnly: true,

            args: [
                {
                    key: "count",
                    prompt: "How often do you want to repeat it? Reply `0` to repeat indefinitely.",
                    type: "integer"
                }
            ]
        });
    }

    run = async (message, {count}) => {
        if (message.guild.player) {
            if (message.guild.player.status === "playing" || message.guild.player.status === "paused") {
                message.guild.player.loop(count);
                message.channel.send(`I'll repeat it \`${count}\` times.`);
                return;
            }
        }

        message.channel.send("Nothing is playing yet.");
    };

};
