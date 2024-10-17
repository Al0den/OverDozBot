const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const { PermissionFlagsBits } = require('discord.js');

const { updateBcMessage } = require('../../utils/update_message.js');

const fs = require('fs').promises; // Import fs with promises for async file operations
const path = require('path'); // To handle file paths

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bc-message-add')
        .setDescription('Envoie un message qui se met a jour tout seul'),
    async execute(interaction) {
        await interaction.reply('Message temporaire');

        const message = await interaction.fetchReply();
        const messageId = message.id;
        const channelId = message.channel.id;

        const jsonFilePath = path.join(__dirname, '../../data/bc.json');
        const jsonData = JSON.parse(await fs.readFile(jsonFilePath, 'utf-8'));

        // Ensure messageAdd and channelAdd exist in jsonData
        if (!jsonData['messageAdd']) {
            jsonData['messageAdd'] = "";
        }
        if (!jsonData['channelAdd']) {
            jsonData['channelAdd'] = "";
        }

        jsonData['messageAdd'] = messageId;
        jsonData['channelAdd'] = channelId;

        // Save updated jsonData
        await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 4));

        // Get current week
        const requiredRessources = jsonData['requiredRessources'] || [];

        // Generate buttons for each required item
        const buttons = requiredRessources.map((itemData, index) => {
            const { item, amount, current } = itemData;
            return new ButtonBuilder()
                .setCustomId(`add_item_bc_${index}`) // Unique ID for each button
                .setLabel(`${item}`) // Show item name and progress
                .setStyle(ButtonStyle.Primary);
        });

        // Create a row of buttons (you can add multiple rows if needed)
        const row = new ActionRowBuilder().addComponents(buttons);

        // Edit the reply to include buttons
        await interaction.editReply({
            content: 'Voici la liste des éléments requis. Pour en rajouter, utiliser le bouton correspondant',
            components: [row], // Attach the button row to the message
        });

        // Call the update function
        updateBcMessage(interaction.client);

    },
};
