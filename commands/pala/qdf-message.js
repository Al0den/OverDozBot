const { SlashCommandBuilder } = require('discord.js');

const { PermissionFlagsBits } = require('discord.js');

const { updateQdfMessage } = require('../../utils/update_message.js');

const fs = require('fs').promises; // Import fs with promises for async file operations
const path = require('path'); // To handle file paths

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qdf-message')
        .setDescription('Envoie un message qui se met a jour tout seul')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.reply('.');

        const message = await interaction.fetchReply();

        const messageId = message.id;
        const channelId = message.channel.id;

        const jsonFilePath = path.join(__dirname, '../../data/qdf.json');

        const jsonData = JSON.parse(await fs.readFile(jsonFilePath, 'utf-8'));

        if(!jsonData['message']) {
            jsonData['message'] = "";
        }
        if(!jsonData['channel']) {
            jsonData['channel'] = "";
        }

        jsonData['message'] = messageId;
        jsonData['channel'] = channelId;

        await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 4));
        updateQdfMessage(interaction.client);
    },
};
