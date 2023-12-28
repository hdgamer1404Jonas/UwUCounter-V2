import { Prisma, PrismaClient } from '@prisma/client';
import discord from 'discord.js';
import { onGuildCreate } from '../handlers/guildCreate';

export async function validateDB(client: discord.Client, prisma: PrismaClient) {
    await client.guilds.cache.forEach(async guild => {
        await onGuildCreate(guild);
    });
}