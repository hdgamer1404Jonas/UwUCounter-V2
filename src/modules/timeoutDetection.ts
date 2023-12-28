import discord from "discord.js";
import { timeoutStorage } from "../types/timeoutStorage";
import { getPrisma } from "..";
import { options } from "../types/options";

let timeouts: timeoutStorage[] = [];

export async function detect(message: discord.Message, client: discord.Client) {
    // check if the user + guild is already in the timeout array
    const timeout = timeouts.find(timeout => timeout.guildID === message.guild.id && timeout.userID === message.author.id);

    // if the user + guild is not in the timeout array, add it
    // get the current time as unix timestamp
    const currentTime = Math.floor(Date.now() / 1000);

    if(!timeout) {
        timeouts.push({
            guildID: message.guild.id,
            userID: message.author.id,
            lastMessage: currentTime.toString()
        });
        return;
    }

    // if the user + guild is in the timeout array, check if the last message was sent less than 1 second ago
    if(parseInt(timeout.lastMessage) + 1 > currentTime) {
        const prismaClient = await getPrisma();

        // get the guild options
        const options: options = await prismaClient.guild_settings.findFirst({
            where: {
                guild_id: message.guild.id
            }
        }).then(guild => JSON.parse(guild.settings));

        if(options.timeout) {
            const languageFile = require(`../../languages/${options.language}.json`);

            // check if the bot can timeout the user
            const guildUser = message.guild.members.cache.get(message.author.id);
            const botUser = message.guild.members.cache.get(client.user.id);

            let permissions;

            if(message.channel.isDMBased()) {
                permissions = true;
            }else {
                permissions = message.channel.permissionsFor(botUser).has("ModerateMembers");

                // check if the user has a higher role than the bot
                if(guildUser.roles.highest.comparePositionTo(botUser.roles.highest) > 0) {
                    permissions = false;
                }
            }

            if(permissions) {
                await guildUser.timeout(options.timeoutDuration);

                const embed = new discord.EmbedBuilder()
                    .setTitle(languageFile["modules"]["timeout"]["title"])
                    .setDescription(languageFile["modules"]["timeout"]["description"])
                    .addFields(
                        { name: languageFile["modules"]["timeout"]["duration"], value: options.timeoutDuration.toString() + " " + languageFile["modules"]["timeout"]["seconds"] },
                    )
                    .setColor(0xff0000)

                await message.channel.send({
                    embeds: [embed]
                });

            }else {
                const embed = new discord.EmbedBuilder()
                    .setTitle(languageFile["errors"]["noTimeoutPermission"]["title"])
                    .setDescription(languageFile["errors"]["noTimeoutPermission"]["description"])
                    .setColor(0xff0000)

                await message.channel.send({
                    embeds: [embed]
                });
            }
        }
    }

    // update the last message time
    timeouts = timeouts.map(timeout => {
        if(timeout.guildID === message.guild.id && timeout.userID === message.author.id) {
            timeout.lastMessage = currentTime.toString();
        }
        return timeout;
    });
}