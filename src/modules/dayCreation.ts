import discord from "discord.js";
import { getPrisma } from "..";

export async function createForDay(guild: discord.Guild) {
    const prismaClient = await getPrisma();

    const date = new Date().toISOString().substring(0, 10).toString();

    // check if the day is already in the database
    const day = await prismaClient.data.findFirst({
        where: {
            guildID: guild.id,
            day: date
        }
    });

    // if the day is not in the database, add it
    if(!day) {
        await prismaClient.data.create({
            data: {
                guildID: guild.id,
                day: date,
                count: 0
            }
        });
    }
}