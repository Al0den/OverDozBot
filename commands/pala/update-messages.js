const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { updateQdfMessage, updateBcMessage } = require('../../utils/update_message.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-messages')
        .setDescription('Force la MAJ des items'),
    async execute(interaction) {
        updateQdfMessage(interaction.client);
        updateBcMessage(interaction.client);
        await interaction.reply({
            content: "Done!",
            ephemeral: true
        })
    }
}
