const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { updateBcMessage } = require('../../utils/update_message.js');

const fs = require('fs');
const path = require('path');

const bcFilePath = path.resolve(__dirname, '../../data/bc.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bc-add')
        .setDescription('Ajoute des items a la base claim'),
    async execute(interaction) {
        let bcData = JSON.parse(fs.readFileSync(bcFilePath));

        const requiredItems = bcData["requiredRessources"];

        if (!requiredItems || requiredItems.length === 0) {
            return interaction.reply({
                content: 'Aucun article requis pour la semaine actuelle.',
                ephemeral: true
            });
        }

        const buttons = requiredItems.map((item, index) => 
            new ButtonBuilder()
                .setCustomId(`add_item_${index}`)
                .setLabel(item.item)
                .setStyle(ButtonStyle.Primary)
        );

        const actionRow = new ActionRowBuilder().addComponents(buttons);

        await interaction.reply({
            content: 'Veuillez sélectionner un article à ajouter à la QDF :',
            components: [actionRow],
            ephemeral: true,
        });

        const filter = i => i.customId.startsWith('add_item_') && i.user.id === interaction.user.id;
        const buttonInteraction = await interaction.channel.awaitMessageComponent({ filter, time: 60000 }).catch(() => null);

        if (!buttonInteraction) {
            return interaction.followUp('Temps écoulé. Veuillez réessayer.');
        }

        // Get the index of the item selected
        const itemIndex = parseInt(buttonInteraction.customId.split('_')[2]);
        const selectedItem = requiredItems[itemIndex];

        // Create a modal for entering the amount
        const amountModal = new ModalBuilder()
            .setCustomId('amount_modal')
            .setTitle(`Ajouter ${selectedItem.item}`);

        const amountInput = new TextInputBuilder()
            .setCustomId('amount_input')
            .setLabel('Quantité')
            .setStyle(TextInputStyle.Short);

        amountModal.addComponents(new ActionRowBuilder().addComponents(amountInput));

        await buttonInteraction.showModal(amountModal);

        const modalSubmitInteraction = await buttonInteraction.awaitModalSubmit({ time: 15000 }).catch(() => null);
        if (!modalSubmitInteraction) {
            return interaction.followUp('Temps écoulé. L\'ajout de l\'article a été annulé.');
        }

        await modalSubmitInteraction.deferReply({ephemeral : true});
        const amount = parseInt(modalSubmitInteraction.fields.getTextInputValue('amount_input'), 10);

        // Update the JSON to reflect the added item
        const userId = modalSubmitInteraction.user.id;

        if(!bcData["usersData"]) {
            bcData["usersData"] = {};
        }

        const currentWeekData = bcData["usersData"];
        if (!currentWeekData[userId]) {
            currentWeekData[userId] = { addedItems: {} };
        }

        // Update the item's amount
        if (!currentWeekData[userId].addedItems[selectedItem.item]) {
            currentWeekData[userId].addedItems[selectedItem.item] = 0;
        }
        currentWeekData[userId].addedItems[selectedItem.item] += amount;

        bcData["usersData"] = currentWeekData;
        bcData["requiredRessources"][itemIndex].current += amount;

        // Save the updated data back to the JSON file
        try {
            fs.writeFileSync(bcFilePath, JSON.stringify(bcData, null, 2));
            console.log(`Article ajouté : ${selectedItem.item} (${amount}) pour l'utilisateur ${userId}`);
            updateBcMessage(interaction.client);
            await modalSubmitInteraction.followUp(`Article ajouté : ${selectedItem.item} (${amount}).`);
        } catch (error) {
            console.error('Error writing JSON file:', error);
            await modalSubmitInteraction.followUp('Erreur lors de la mise à jour des données QDF.');
        }
    },
};
