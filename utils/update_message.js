const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function updateBcMessage(client) {
    try {
        const jsonFilePath = path.join(__dirname, '../data/bc.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

        const messageId = jsonData['message'];
        const channelId = jsonData['channel'];

         const channel = await client.channels.fetch(channelId);
         const message = await channel.messages.fetch(messageId);

        const secondEmbed = new EmbedBuilder()
            .setTitle(`Articles requis pour la base claim`)
            .setColor('#0099ff'); // Set the color of the embed

        if (jsonData && jsonData.requiredRessources && jsonData.requiredRessources.length > 0) {
            const requiredItems = jsonData.requiredRessources.map(item => {
                const requiredAmount = item.amount;
                const currentAmount = item.current;
                const progress = Math.min((currentAmount / requiredAmount) * 100, 100); // Calculate progress
                const progressBar = createProgressBar(progress);

                return `**${item.item}** - Requis: ${requiredAmount}, Actuel: ${currentAmount}\n${progressBar}\n`;
            }).join('\n');

            secondEmbed.setDescription(requiredItems);
        } else {
            secondEmbed.setDescription('Aucun article requis pour le moment.');
        }

        const embed = new EmbedBuilder()
            .setTitle(`Contributions des membres pour la base claim`)
            .setColor('#0099ff'); // Set the color of the embed

        if (jsonData && jsonData.usersData) {
            const requiredItems = jsonData.requiredRessources;

            for (const item of requiredItems) {
                const itemName = item.item;
                const totalRequiredAmount = item.amount;

                let itemDescription = `**${itemName}** - Total requis: ${totalRequiredAmount}\n`;

                const contributions = [];

                for (const [userId, userData] of Object.entries(jsonData.usersData)) {
                    const addedItems = userData.addedItems;
                    const userContribution = addedItems[itemName] || 0; // Get contribution for this item

                    const user = client.users.cache.get(userId);
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
            embed.setDescription('Aucune donnée utilisateur disponible.');
        }
        
        await message.edit({ embeds: [secondEmbed] });
    } catch(e) {
        console.error(e);
    }

}

async function updateQdfMessage(client) {
    try {
        const jsonFilePath = path.join(__dirname, '../data/qdf.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

        const currentWeekKey = jsonData['current-week'];
        const currentWeekData = jsonData[currentWeekKey];
        const messageId = jsonData['message'];
        const channelId = jsonData['channel'];

        // Fetch the channel and message
        const channel = await client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);

        // Create the embed (this part can be re-used from your command)
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
                    const userContribution = addedItems[itemName] || 0;

                    const user = client.users.cache.get(userId);
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
                embed.addFields({ name: itemName, value: itemDescription.trim() });
            }
        } else {
            embed.setDescription('Aucune donnée utilisateur disponible pour cette semaine.');
        }

        const secondEmbed = new EmbedBuilder()
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

            secondEmbed.setDescription(requiredItems);
        } else {
            secondEmbed.setDescription('Aucun article requis pour cette semaine.');
        }
        // Update the message with the new embed
        await message.edit({ embeds: [secondEmbed] });
    } catch (e) {
        console.error(e);
    }
}


// Function to create a progress bar
function createProgressBar(percent) {
    const totalBars = 10; // Total number of bars
    const filledBars = Math.round((percent / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    const filled = '█'.repeat(filledBars); // Filled part of the bar
    const empty = '░'.repeat(emptyBars);   // Empty part of the bar

    return `[${filled}${empty}] ${percent.toFixed(0)}%`; // Return formatted progress bar
}

module.exports = { updateQdfMessage, updateBcMessage };
