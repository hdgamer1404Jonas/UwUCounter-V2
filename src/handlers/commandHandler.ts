import discord from "discord.js"
import { Prisma, PrismaClient } from '@prisma/client';
import { getPrisma } from "..";
import { options } from "../types/options";
import path from "path";
const fs = require("fs");

export async function update(guild: discord.Guild, client: discord.Client) {

    const prismaClient = await getPrisma();

    const guildOptions = await prismaClient.guild_settings.findFirst({
        where: {
            guild_id: guild.id
        }
    });
    const settings: options = JSON.parse(guildOptions.settings);

    const langFile = require(path.join(__dirname, "..", "..", "languages", settings.language + ".json"));

    const commandFilePath = path.join(__dirname, "..", "commands");
    const commandFiles = fs.readdirSync(commandFilePath).filter((file: string) => file.endsWith(".js"));
    const commandData: discord.ApplicationCommandData[] = [];

    await commandFiles.forEach(async (file: string) => {
        const cf = require(path.join(commandFilePath, file));
        const commandInfo = await cf.getCommandInfo(langFile);

        commandData.push({
            name: commandInfo.name,
            description: commandInfo.description,
            options: commandInfo.options,
            defaultMemberPermissions: commandInfo.defaultMemberPermissions
        })
    });

    await guild.commands.set(commandData);

    console.log(`Updated commands in ${guild.name}`);
}

export async function updateAll(client: discord.Client) {
    client.guilds.cache.forEach(async guild => {
        await update(guild, client);
    });
}

export async function execute(interaction: discord.ChatInputCommandInteraction, client: discord.Client) {
    const guild = interaction.guild;
    const prismaClient = await getPrisma();

    const guildOptions = await prismaClient.guild_settings.findFirst({
        where: {
            guild_id: guild.id
        }
    });
    const settings: options = JSON.parse(guildOptions.settings);
    const langFile = require(path.join(__dirname, "..", "..", "languages", settings.language + ".json"));
    const commandFilePath = path.join(__dirname, "..", "commands");
    const commandFiles = fs.readdirSync(commandFilePath).filter((file: string) => file.endsWith(".js"));

    await commandFiles.forEach(async (file: string) => {
        const cf = require(path.join(commandFilePath, file));
        const commandInfo = await cf.getCommandInfo(langFile);
        if (commandInfo.name == interaction.commandName) {
            await cf.execute(interaction, client, langFile);
        }
    });

}