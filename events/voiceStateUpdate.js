const { Events } = require('discord.js');
const fs = require('fs');
const jsonFilePath = './data/voice.json';

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const userId = newState.id;
        const username = newState.member.user.tag;

        voiceData = JSON.parse(fs.readFileSync(jsonFilePath));

        if (!voiceData[userId]) {
            voiceData[userId] = {
                username: username,
                sessions: []
            };
        }

        if (!oldState.channelId && newState.channelId) {
            console.log(`${username} joined the voice channel ${newState.channel.name}`);

            voiceData[userId].sessions.push({
                channelId: newState.channelId,
                channelName: newState.channel.name,
                joinTime: new Date().toISOString(),
                leaveTime: null // Leave time will be updated later
            });
            
            fs.writeFileSync(jsonFilePath, JSON.stringify(voiceData, null, 2));
        } else if (oldState.channelId && !newState.channelId) {
            console.log(`${username} left the voice channel ${oldState.channel.name}`);

            const userSessions = voiceData[userId]?.sessions;
            if (userSessions && userSessions.length > 0) {
                const lastSession = userSessions[userSessions.length - 1];
                if (!lastSession.leaveTime) {
                    lastSession.leaveTime = new Date().toISOString();

                    const joinTime = new Date(lastSession.joinTime);
                    const leaveTime = new Date(lastSession.leaveTime);
                    const durationMs = leaveTime - joinTime;
                    const durationMinutes = Math.floor(durationMs / 60000); // Convert to minutes
                    console.log(`${username} spent ${durationMinutes} minutes in the channel`);

                    fs.writeFileSync(jsonFilePath, JSON.stringify(voiceData, null, 2));
                } else {
                    // Something bugged, but not an issue. Probably bot restart.
                }
            }
        }

    },
};
