const { Events, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle  } = require('discord.js');
const { updateQdfMessage } = require('../utils/update_message.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const qdfFilePath = path.join(__dirname, '../data/qdf.json');
        if(interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }

        if(interaction.isButton()) {
            if (interaction.customId.startsWith('add_item_')) {
                const index = parseInt(interaction.customId.split('_')[2]);

                const qdfData = JSON.parse(fs.readFileSync(qdfFilePath, 'utf-8'));
                const currentWeek = qdfData['current-week'];
                const requiredItems = qdfData[currentWeek]?.requiredItems;

                if (!requiredItems || requiredItems.length <= index) {
                    return interaction.reply({
                        content: 'Article non trouvé.',
                        ephemeral: true
                    });
                }

                const selectedItem = requiredItems[index];

                const modal = new ModalBuilder()
                    .setCustomId(`amount_modal_${index}`) // Include index in customId for later reference
                    .setTitle(`Ajouter ${selectedItem.item}`);

                const amountInput = new TextInputBuilder()
                    .setCustomId('amount_input')
                    .setLabel('Quantité')
                    .setStyle(TextInputStyle.Short);

                modal.addComponents(new ActionRowBuilder().addComponents(amountInput));

                await interaction.showModal(modal);
            }
        }

        if(interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('amount_modal_')) {
                const index = parseInt(interaction.customId.split('_')[2]);

                // Read JSON data to get the current week's items
                const qdfData = JSON.parse(fs.readFileSync(qdfFilePath, 'utf-8'));
                const currentWeek = qdfData['current-week'];
                const requiredItems = qdfData[currentWeek]?.requiredItems;

                if (!requiredItems || requiredItems.length <= index) {
                    return interaction.reply({
                        content: 'Article non trouvé.',
                        ephemeral: true
                    });
                }

                const selectedItem = requiredItems[index];
                const amount = parseInt(interaction.fields.getTextInputValue('amount_input'), 10);

                if (isNaN(amount) || amount <= 0) {
                    return interaction.reply({
                        content: 'Quantité invalide. Veuillez saisir un nombre positif.',
                        ephemeral: true
                    });
                }
                const userId = interaction.user.id;

                if (!qdfData[currentWeek]['usersData']) {
                    qdfData[currentWeek]['usersData'] = {};
                }

                const currentWeekData = qdfData[currentWeek]['usersData'];

                if (!currentWeekData[userId]) {
                    currentWeekData[userId] = { addedItems: {} };
                }

                if (!currentWeekData[userId].addedItems[selectedItem.item]) {
                    currentWeekData[userId].addedItems[selectedItem.item] = 0;
                }
                currentWeekData[userId].addedItems[selectedItem.item] += amount;

                selectedItem.current += amount;

                try {
                    // Save the updated JSON data back to the file
                    fs.writeFileSync(qdfFilePath, JSON.stringify(qdfData, null, 2));
                    console.log(`Article mis à jour : ${selectedItem.item} (+${amount})`);
                    await interaction.reply({
                        content: `Article ajouté : ${selectedItem.item} (+${amount}).`,
                        ephemeral: true
                    });

                    // Call your update function to refresh the QDF message
                } catch (error) {
                    console.error('Error writing JSON file:', error);
                    await interaction.reply({
                        content: 'Erreur lors de la mise à jour des données QDF.',
                        ephemeral: true
                    });
                }

                updateQdfMessage(interaction.client);

            }
        }
    },
};
