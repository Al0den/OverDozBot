const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const fs = require('fs');
const path = require('path');

const qdfFilePath = path.resolve(__dirname, '../../data/qdf.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qdf-add')
        .setDescription('Ajoute des items a la QDF'),
    async execute(interaction) {
        let qdfData;
        try {
            const data = fs.readFileSync(qdfFilePath);
            qdfData = JSON.parse(data);
        } catch (error) {
            console.error('Error reading JSON file:', error);
            return interaction.reply('Erreur lors de la lecture des données QDF.');
        }

        const currentWeek = qdfData['current-week'];
        const requiredItems = qdfData[currentWeek]?.requiredItems;

        if (!requiredItems || requiredItems.length === 0) {
            return interaction.reply('Aucun article requis pour la semaine actuelle.');
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

        await modalSubmitInteraction.deferReply();
        const amount = parseInt(modalSubmitInteraction.fields.getTextInputValue('amount_input'), 10);

        // Update the JSON to reflect the added item
        const userId = modalSubmitInteraction.user.id;

        if(!qdfData[currentWeek]["usersData"]) {
            qdfData[currentWeek]["usersData"] = {};
        }

        const currentWeekData = qdfData[currentWeek]["usersData"];
        if (!currentWeekData[userId]) {
            currentWeekData[userId] = { addedItems: {} };
        }

        // Update the item's amount
        if (!currentWeekData[userId].addedItems[selectedItem.item]) {
            currentWeekData[userId].addedItems[selectedItem.item] = 0;
        }
        currentWeekData[userId].addedItems[selectedItem.item] += amount;

        qdfData[currentWeek]["usersData"] = currentWeekData;
        qdfData[currentWeek]["requiredItems"][itemIndex].current += amount;

        // Save the updated data back to the JSON file
        try {
            fs.writeFileSync(qdfFilePath, JSON.stringify(qdfData, null, 2));
            console.log(`Article ajouté : ${selectedItem.item} (${amount}) pour l'utilisateur ${userId}`);
            await modalSubmitInteraction.followUp(`Article ajouté : ${selectedItem.item} (${amount}).`);
        } catch (error) {
            console.error('Error writing JSON file:', error);
            await modalSubmitInteraction.followUp('Erreur lors de la mise à jour des données QDF.');
        }
    },
};
