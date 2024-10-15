const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qdf-status')
        .setDescription('Donne le status actuel de la QDF'),
    async execute(interaction) {
        const jsonFilePath = path.join(__dirname, '../../data/qdf.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

        const currentWeekKey = jsonData['current-week'];
        const currentWeekData = jsonData[currentWeekKey];

        // Create an embed
        const embed = new EmbedBuilder()
            .setTitle(`Articles requis pour ${currentWeekKey}`)
            .setColor('#0099ff'); // Set the color of the embed

        if (currentWeekData && currentWeekData.requiredItems && currentWeekData.requiredItems.length > 0) {
            const requiredItems = currentWeekData.requiredItems.map(item => {
                const requiredAmount = item.amount;
                const currentAmount = item.current;
                const progress = Math.min((currentAmount / requiredAmount) * 100, 100); // Calculate progress
                const progressBar = createProgressBar(progress);

                return `**${item.item}** - Requis: ${requiredAmount}, Actuel: ${currentAmount}\n${progressBar}\n`;
            }).join('\n');

            embed.setDescription(requiredItems);
        } else {
            embed.setDescription('Aucun article requis pour cette semaine.');
        }

        // Send the embed as a response
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};


// Function to create a progress bar
function createProgressBar(percent) {
    const totalBars = 10; // Total number of bars
    const filledBars = Math.round((percent / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    const filled = '█'.repeat(filledBars); // Filled part of the bar
    const empty = '░'.repeat(emptyBars);   // Empty part of the bar

    return `[${filled}${empty}] ${percent.toFixed(0)}%`; // Return formatted progress bar
}
