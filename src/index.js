require("dotenv").config();
const LacuClient = require("./util/LacuClient");
const path = require("path");

process.env.TZ = "Europe/Amsterdam";

const client = new LacuClient({
    owner: process.env.OWNER_ID,
    commandPrefix: process.env.PREFIX
});

client.registry
    .registerGroups([
        ["controls", "Player controls"]
    ])
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, "commands"))

client.login(process.env.BOT_TOKEN);


