const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');

const { updateBcMessage } = require('../../utils/update_message.js');

const fs = require('fs').promises; // Import fs with promises for async file operations
const path = require('path'); // To handle file paths

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bc-init')
        .setDescription('Met en place les ressources pour la base claim')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const bcFilePath = path.join(__dirname, '../../data', 'bc.json');

        const bcData = {}

        await interaction.reply({
            content: `Mise en place de la base claim.`,
            ephemeral: true
        });

        const requiredRessources = [];

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

            await interaction.followUp({
                content: 'Veuillez ajouter des articles ou terminer la configuration.',
                components: [actionRow],
                ephemeral: true
            });

            const filter = i => i.customId === 'add_item' || i.customId === 'finish';
            const buttonInteraction = await interaction.channel.awaitMessageComponent({ filter, time: 60000 }).catch(() => null);

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

                requiredRessources.push({ item, amount, current });
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


        const bcSummary = requiredRessources.map(({ item, amount }) => `${item} : ${amount}`).join('\n') || 'Aucun article ajouté.';

        try {
            bcData["requiredRessources"] = requiredRessources;

            await fs.writeFile(bcFilePath, JSON.stringify(bcData, null, 2));

            await interaction.followUp({
                content: `Base claim configurée. \nRésumé:\n${bcSummary}`,
                ephemeral: true
            })
            updateBcMessage(interaction.client);
        } catch (error) {
            console.error('Erreur lors de la gestion du fichier base claim:', error);
            await interaction.followUp({
                content: 'Une erreur est survenue lors de la configuration de la bc.',
                ephemeral: true
            });
        }
    },
};
