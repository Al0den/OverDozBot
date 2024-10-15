const { SlashCommandBuilder } = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');

const { updateQdfMessage } = require('../../utils/update_message.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qdf-remove')
        .setDescription('Supprime une qdf')
        .addStringOption(option => option.setName('semaine').setDescription('La semaine a supprimer').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const semaine = interaction.options.getString('semaine');
        const jsonFilePath = path.join(__dirname, '../../data/qdf.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        if (jsonData[`week-${semaine}`]) {
            delete jsonData[`week-${semaine}`];
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 4));
            await interaction.reply({
                content: `La QDF pour la semaine ${semaine} a été supprimée.`,
                ephemeral: true
            });
            updateQdfMessage(interaction.client);
        } else {
            await interaction.reply({
                content:`Aucune QDF trouvée pour la semaine ${semaine}.`,
                ephemeral: true
            });
        }
    },
};
