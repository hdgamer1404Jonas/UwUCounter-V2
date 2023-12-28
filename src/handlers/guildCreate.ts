import discord from "discord.js";
import path from "path";
import { getPrisma } from "..";
import { createForDay } from "../modules/dayCreation";
import { update } from "./commandHandler";

export async function onGuildCreate(guild: discord.Guild) {
    const defaultConfig = require(path.join(__dirname, "..", "..", "defaultOptions.json"));
    const prismaClient = await getPrisma();
    
    // Check if guild is already in database
    const guildOptions = await prismaClient.guild_settings.findFirst({
        where: {
            guild_id: guild.id
        }
    });

    // If guild is not in database, add it
    if(!guildOptions) {
        await prismaClient.guild_settings.create({
            data: {
                guild_id: guild.id,
                settings: JSON.stringify(defaultConfig)
            }
        });
    }

    await createForDay(guild);
    await update(guild, guild.client);

}