import discord from "discord.js";
import { getPrisma } from "..";
import { countWords } from "../modules/uwuCounter";
import { options } from "../types/options";
import path from "path";

export async function onUWU(message: discord.Message, client: discord.Client) {
    if(message.author.id === client.user.id) return;


    const count = await countWords(message, "uwu");

    const prismaClient = await getPrisma();

    const date = new Date().toISOString().substring(0, 10).toString();

    // check if there is an user entry for the day
    const user = await prismaClient.users.findFirst({
        where: {
            id: message.author.id,
            date: date
        }
    });

    if(user) {
        // add the count to the user
        await prismaClient.users.update({
            where: {
                id: message.author.id,
                date: date,
                idIndex: user.idIndex
            },
            data: {
                count: user.count + count
            }
        });
    }else {
        // create a new user entry
        await prismaClient.users.create({
            data: {
                id: message.author.id,
                date: date,
                count: count
            }
        });
    }

    // add the count to the guild entry
    const guild = await prismaClient.data.findFirst({
        where: {
            guildID: message.guild.id,
            day: date
        }
    });

    if(guild) {
        await prismaClient.data.update({
            where: {
                guildID_day: {
                    guildID: message.guild.id,
                    day: date
                }
            },
            data: {
                count: guild.count + count
            }
        });
    }else {
        await prismaClient.data.create({
            data: {
                guildID: message.guild.id,
                day: date,
                count: count
            }
        });
    }

    const guildOptions = await prismaClient.guild_settings.findFirst({
        where: {
            guild_id: message.guild.id
        }
    });

    const settings: options = JSON.parse(guildOptions.settings);

    if(settings.reactions) {
        // check if the client has the permissions to add reactions
        const guildMember = message.guild.members.resolve(client.user.id);
        // check if the channel allows reactions
        let permissions;
        if(message.channel.isDMBased()) {
            permissions = true;
        }else {
            permissions = message.channel.permissionsFor(guildMember).has("AddReactions");
        }

        if(permissions) {
            // add a reaction to the message
            const identifier = client.emojis.resolveIdentifier('1091873715551215617');
            if (identifier) message.react(identifier);
        }else {

            const languageFile = require(path.join(__dirname, "..", "..", "languages", settings.language + ".json"));

            const embed = new discord.EmbedBuilder()
                .setTitle(languageFile["errors"]["noReactionPermission"]["title"])
                .setDescription(languageFile["errors"]["noReactionPermission"]["description"])
                .setColor(0xFF0000)

            await message.channel.send({
                embeds: [embed]
            });
        }
    }
}