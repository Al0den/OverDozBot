const { Events } = require('discord.js');
const path = require('path');
const { guildId } = require('../SECRET.json');
const fs = require('fs');

const jsonFilePath = './data/voice.json';

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        let sessionsDiscarded = 0;
        let voiceData = JSON.parse(fs.readFileSync(jsonFilePath));

        for (const userId in voiceData) {
            const userSessions = voiceData[userId].sessions;

            const completedSessions = userSessions.filter(session => session.leaveTime !== null);
            const incompleteSessions = userSessions.filter(session => session.leaveTime === null);

            if (incompleteSessions.length > 0) {
                console.log(`Found incomplete session(s) for user ${voiceData[userId].username}. Discarding them...`);
                sessionsDiscarded += incompleteSessions.length;
            }

            voiceData[userId].sessions = completedSessions;
        }

        if (sessionsDiscarded > 0) {
            console.log(`Discarded ${sessionsDiscarded} incomplete session(s).`);
        } else {
            console.log('No incomplete sessions found.');
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error(`Guild with ID ${guildId} not found.`);
            return;
        }

        // Iterate through the guild's voice channels and start sessions for any users currently in them
        guild.channels.cache.forEach(channel => {
            if (channel.isVoiceBased()) {  // Only voice channels
                console.log(`Checking channel ${channel.name}`);
                channel.members.forEach(member => {
                    const userId = member.user.id;
                    const username = member.user.tag;

                    // Start logging sessions for this user if they don't already have an active session
                    if (!voiceData[userId]) {
                        voiceData[userId] = {
                            username: username,
                            sessions: []
                        };
                    }

                    const activeSession = voiceData[userId].sessions.find(session => session.leaveTime === null);
                    if (!activeSession) {
                        // If there's no active session, create one
                        voiceData[userId].sessions.push({
                            channelId: channel.id,
                            channelName: channel.name,
                            joinTime: new Date().toISOString(),
                            leaveTime: null
                        });
                        console.log(`Started a session for ${username} in ${channel.name}`);
                    }
                });
            }
        });
        fs.writeFileSync(jsonFilePath, JSON.stringify(voiceData, null, 4));
    },
};
