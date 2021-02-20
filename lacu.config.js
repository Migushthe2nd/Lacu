module.exports = {
    apps: [
        {
            name: "lacu",
            script: "./src/index.js",
            instances: 1,
            autorestart: true,
            watch: true,
            ignore_watch: [],
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
