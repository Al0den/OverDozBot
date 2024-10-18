const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { updateBcMessage } = require('../../utils/update_message.js');
const fs = require('fs').promises; // Import fs with promises for async file operations
const path = require('path'); // To handle file paths

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bc-message-add')
        .setDescription('Envoie un message qui se met à jour tout seul'),
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

        if (requiredRessources.length === 0) {
            await interaction.editReply({
                content: "Aucun item requis pour la base claim"
            });
            return;
        }

        // Generate buttons for each required item, and split them into rows of up to 5 buttons each
        const rows = [];
        for (let i = 0; i < requiredRessources.length; i += 5) {
            const buttonSet = requiredRessources.slice(i, i + 5).map((itemData, index) => {
                const { item } = itemData;
                return new ButtonBuilder()
                    .setCustomId(`add_item_bc_${i + index}`) // Unique ID for each button
                    .setLabel(`${item}`) // Show item name
                    .setStyle(ButtonStyle.Primary);
            });

            // Create an ActionRowBuilder and add the current set of buttons
            rows.push(new ActionRowBuilder().addComponents(buttonSet));
        }

        // Edit the reply to include buttons in multiple rows if necessary
        await interaction.editReply({
            content: 'Voici la liste des éléments requis. Pour en rajouter, utiliser le bouton correspondant',
            components: rows, // Attach the button rows to the message
        });

        // Call the update function
        updateBcMessage(interaction.client);
    },
};
