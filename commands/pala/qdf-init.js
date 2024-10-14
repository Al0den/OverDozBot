const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');

const { updateQdfMessage } = require('../../utils/update_message.js');

const fs = require('fs').promises; // Import fs with promises for async file operations
const path = require('path'); // To handle file paths

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qdf-init')
        .setDescription('Met en place la QDF de la semaine')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const qdf = []; // Store items and amounts for the QDF

        const weekModal = new ModalBuilder()
            .setCustomId('week_modal')
            .setTitle('Configuration de la QDF');

        const weekInput = new TextInputBuilder()
            .setCustomId('week_input')
            .setLabel('Quelle semaine mettons en place ?')
            .setStyle(TextInputStyle.Short);

        weekModal.addComponents(new ActionRowBuilder().addComponents(weekInput));

        await interaction.showModal(weekModal);

        const weekSubmitInteraction = await interaction.awaitModalSubmit({ time: 60000 }).catch(() => null);
        if (!weekSubmitInteraction) {
            return interaction.followUp({
                content: 'Temps écoulé. La configuration a été annulée.',
                ephemeral: true
            });
        }

        await weekSubmitInteraction.deferReply({ephemeral: true});
        const week = weekSubmitInteraction.fields.getTextInputValue('week_input');
        await weekSubmitInteraction.followUp(`Configuration pour la semaine ${week}.`);

        let finished = false; // Flag to indicate if the user is done adding items

        while (!finished) {
            const addItemButton = new ButtonBuilder()
                .setCustomId('add_item')
                .setLabel('Ajouter un article')
                .setStyle(ButtonStyle.Primary);

            const finishButton = new ButtonBuilder()
                .setCustomId('finish')
                .setLabel('Terminer')
                .setStyle(ButtonStyle.Secondary);

            const actionRow = new ActionRowBuilder().addComponents(addItemButton, finishButton);

            await weekSubmitInteraction.followUp({
                content: 'Veuillez ajouter des articles ou terminer la configuration.',
                components: [actionRow],
                ephemeral: true
            });

            const filter = i => i.customId === 'add_item' || i.customId === 'finish';
            const buttonInteraction = await weekSubmitInteraction.channel.awaitMessageComponent({ filter, time: 60000 }).catch(() => null);

            if (!buttonInteraction) {
                return interaction.followUp({
                    content: 'Temps écoulé. La configuration a été annulée.',
                    ephemeral: true
                });
            }

            if (buttonInteraction.customId === 'add_item') {
                const addItemModal = new ModalBuilder()
                    .setCustomId('add_item_modal')
                    .setTitle('Ajouter un article');

                const itemInput = new TextInputBuilder()
                    .setCustomId('item_input')
                    .setLabel('Nom de l\'article')
                    .setStyle(TextInputStyle.Short);

                const amountInput = new TextInputBuilder()
                    .setCustomId('amount_input')
                    .setLabel('Quantité')
                    .setStyle(TextInputStyle.Short);

                addItemModal.addComponents(
                    new ActionRowBuilder().addComponents(itemInput),
                    new ActionRowBuilder().addComponents(amountInput)
                );

                await buttonInteraction.showModal(addItemModal);

                const addItemSubmitInteraction = await buttonInteraction.awaitModalSubmit({ time: 15000 }).catch(() => null);
                if (!addItemSubmitInteraction) {
                    return interaction.followUp({
                        content: 'Temps écoulé. L\'ajout de l\'article a été annulé.',
                        ephemeral: true
                    });
                }

                await addItemSubmitInteraction.deferReply({ephemeral: true});
                const item = addItemSubmitInteraction.fields.getTextInputValue('item_input');
                const amount = parseInt(addItemSubmitInteraction.fields.getTextInputValue('amount_input'), 10);
                const current = 0;

                qdf.push({ item, amount, current });
                await addItemSubmitInteraction.followUp({
                    content: `Article ajouté : ${item} (${amount})`,
                    ephemeral: true
                });
            }

            if (buttonInteraction.customId === 'finish') {
                finished = true; // Exit the loop
                await buttonInteraction.deferUpdate();
            }
        }

        const qdfSummary = qdf.map(({ item, amount }) => `${item} : ${amount}`).join('\n') || 'Aucun article ajouté.';

        const qdfFilePath = path.join(__dirname, '../../data', 'qdf.json');
        try {
            const fileData = await fs.readFile(qdfFilePath, 'utf-8');
            const qdfData = JSON.parse(fileData);

            if (qdfData[`week-${week}`]) {
                await weekSubmitInteraction.followUp({
                    content: `La semaine ${week} est déjà configurée. Veuillez choisir une autre semaine ou enlever celle-ci.`,
                    ephemeral: true
                });
                return;
            }

            qdfData[`week-${week}`] = { requiredItems: qdf };
            qdfData['current-week'] = `week-${week}`;

            await fs.writeFile(qdfFilePath, JSON.stringify(qdfData, null, 2));

            await weekSubmitInteraction.followUp({
                content: `QDF configurée pour la semaine ${week}.\nRésumé:\n${qdfSummary}`,
                ephemeral: true
            })
            updateQdfMessage(interaction.client);
        } catch (error) {
            console.error('Erreur lors de la gestion du fichier QDF:', error);
            await weekSubmitInteraction.followUp({
                content: 'Une erreur est survenue lors de la configuration de la QDF.',
                ephemeral: true
            });
        }
    },
};
