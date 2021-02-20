const Discord = require("discord.js");

const base = () => {
    return new Discord.MessageEmbed()
        .setAuthor("Video Player", `${process.env.WEBSITE_BASEURL}/icon_small.png`, `${process.env.LIVE_BASEURL}/`)
        .setColor("#ff0000");
    // .setTimestamp()
    // .setFooter("Powered by new™ super™ walterspeed™ protocols");
};

module.exports.nowPlaying = (guildId, info) => {
    const link = `${process.env.WEBSITE_BASEURL}/?id=${guildId}&player=`;
    const embed = base()
        .setTitle(":arrow_forward:  Now playing:")
        .setDescription(`*${info.title || info.filename}*\n[Source](${info.webpage_url})`)
        .addField(":signal_strength:  Join the stream here:", `[Lowest delay](${link + "flv"})\n[Low delay](${link + "ws-flv"})`, false);
    // .addField("Veel gebruikers (hls)", `[Klik hier](${link + "hls"})`, true);

    if (!!info.thumbnail) {
        embed.setThumbnail(info.thumbnail);
    }

    return embed;
};

module.exports.currProgress = (info, progress, data) => {
    return base()
        .setTitle(":arrow_forward:  Now playing:")
        .setDescription(`*${info.title || info.filename}*\n[Source](${info.webpage_url})`)
        .addField(`:left_right_arrow:  Progress:`, `\`${progress ? progress.positionString : "00:00:00"}\`/\`${data.durationString}\``, false);
};

module.exports.currStatus = (info, progress, data, status) => {
    const embed = base()
        .setTitle(":arrow_forward:  Now playing:");
    if (info) {
        embed.setDescription(`*${info.title || info.filename}*\n[Source](${info.webpage_url})`);
    }
    embed.addField(`:asterisk:  Status`, `\`${status}\``, false);
    if (progress) {
        embed.addField(`:left_right_arrow:  Progress`, `\`${progress ? progress.positionString : "00:00:00"}\`/\`${data.durationString}\``, false);
    }
    return embed;
};