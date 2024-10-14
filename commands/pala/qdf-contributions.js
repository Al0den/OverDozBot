const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qdf-contributions')
        .setDescription('Donne les contributions indivudelles de chaque membre'),
    async execute(interaction) {
        const jsonFilePath = path.join(__dirname, '../../data/qdf.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

        const currentWeekKey = jsonData['current-week'];
        const currentWeekData = jsonData[currentWeekKey];

        const embed = new EmbedBuilder()
            .setTitle(`Contributions des membres pour ${currentWeekKey}`)
            .setColor('#0099ff'); // Set the color of the embed

        if (currentWeekData && currentWeekData.usersData) {
            const requiredItems = currentWeekData.requiredItems;

            for (const item of requiredItems) {
                const itemName = item.item;
                const totalRequiredAmount = item.amount;

                let itemDescription = `**${itemName}** - Total requis: ${totalRequiredAmount}\n`;

                const contributions = [];

                for (const [userId, userData] of Object.entries(currentWeekData.usersData)) {
                    const addedItems = userData.addedItems;
                    const userContribution = addedItems[itemName] || 0; // Get contribution for this item

                    const user = interaction.client.users.cache.get(userId);
                    const userMention = user ? user.toString() : userId;
                    const contributionPercentage = ((userContribution / totalRequiredAmount) * 100).toFixed(2);

                    contributions.push({
                        userMention,
                        userContribution,
                        contributionPercentage,
                    });
                }

                contributions.sort((a, b) => b.contributionPercentage - a.contributionPercentage);

                for (const { userMention, userContribution, contributionPercentage } of contributions) {
                    itemDescription += `**Utilisateur:** ${userMention} - Contribution: ${userContribution} (${contributionPercentage}%)\n`;
                }

                itemDescription += '\n'; // Blank line for spacing
                embed.addFields({ name: itemName, value: itemDescription.trim() }); // Add item contributions to the embed
            }
        } else {
            embed.setDescription('Aucune donnée utilisateur disponible pour cette semaine.');
        }

        await interaction.reply({ embeds: [embed] });
    },
};
