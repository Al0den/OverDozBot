const { SlashCommandBuilder } = require('discord.js');

const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qdf-remove')
        .setDescription('Supprime une qdf')
        .addStringOption(option => option.setName('semaine').setDescription('La semaine a supprimer').setRequired(true)),
    async execute(interaction) {
        const semaine = interaction.options.getString('semaine');
        const jsonFilePath = path.join(__dirname, '../../data/qdf.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        if (jsonData[`week-${semaine}`]) {
            delete jsonData[semaine];
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 4));
            await interaction.reply(`La QDF pour la semaine ${semaine} a été supprimée.`);
        } else {
            await interaction.reply(`Aucune QDF trouvée pour la semaine ${semaine}.`);
        }
    },
};
