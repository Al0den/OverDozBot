const { SlashCommandBuilder } = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const jsonFilePath = './data/voice.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vocal-info')
        .setDescription('Donne la liste du temps passer en vocal sur les 7 derniers jours!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        let voiceData = JSON.parse(fs.readFileSync(jsonFilePath));
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);  // Calculate the date 7 days ago

        let responseMessage = '**Temps passé en vocal sur les 7 derniers jours :**\n';

        for (const userId in voiceData) {
            const user = voiceData[userId];
            let totalTimeInVoice = 0;

            user.sessions.forEach(session => {
                const joinTime = new Date(session.joinTime);
                const leaveTime = session.leaveTime ? new Date(session.leaveTime) : now;

                if (joinTime >= oneWeekAgo) {
                    const sessionDuration = (leaveTime - joinTime) / 1000 / 60; // Convert duration to minutes
                    totalTimeInVoice += sessionDuration;
                }
            });

            if (totalTimeInVoice > 0) {
                responseMessage += `${user.username} : ${Math.round(totalTimeInVoice)} minutes\n`;
            }
        }

        if (responseMessage === '**Temps passé en vocal sur les 7 derniers jours :**\n') {
            responseMessage += 'Aucune activité vocale trouvée.';
        }

        await interaction.reply(responseMessage);
    },
};
