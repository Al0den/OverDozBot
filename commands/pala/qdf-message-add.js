const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const { PermissionFlagsBits } = require('discord.js');

const { updateQdfMessage } = require('../../utils/update_message.js');

const fs = require('fs').promises; // Import fs with promises for async file operations
const path = require('path'); // To handle file paths

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qdf-message-add')
        .setDescription('Envoie un message qui se met a jour tout seul'),
    async execute(interaction) {
        await interaction.reply('Message temporaire');

        const message = await interaction.fetchReply();
        const messageId = message.id;
        const channelId = message.channel.id;

        const jsonFilePath = path.join(__dirname, '../../data/qdf.json');
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
        const currentWeek = jsonData['current-week'];
        const requiredItems = jsonData[currentWeek]['requiredItems'] || [];

        if(requiredItems == []) {
            await interaction.editReply({
                content: "Aucun items requis pour la QDF"
            })
            return;
        }

        // Generate buttons for each required item
        const buttons = requiredItems.map((itemData, index) => {
            const { item, amount, current } = itemData;
            return new ButtonBuilder()
                .setCustomId(`add_item_qdf_${index}`) // Unique ID for each button
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
        updateQdfMessage(interaction.client);

    },
};
