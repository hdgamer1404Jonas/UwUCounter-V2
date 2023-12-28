import discord from "discord.js";
import { getPrisma } from "..";

export async function addUserToDB(user: discord.User) {
    // check if the user is already in the database for this day
    const prismaClient = await getPrisma();

    const date = new Date().toISOString().substring(0, 10).toString();

    const userEntry = await prismaClient.users.findFirst({
        where: {
            id: user.id,
            date: date
        }
    });

    // if the user is not in the database, add it
    if(!userEntry) {
        await prismaClient.users.create({
            data: {
                id: user.id,
                date: date,
                count: 0
            }
        });
    }
}

export async function addAllUsers(client: discord.Client) {
    client.guilds.cache.forEach(async guild => {
        const members = await guild.members.fetch();
        for (const member of members) {
            await addUserToDB(member[1].user);
        }
    });
}