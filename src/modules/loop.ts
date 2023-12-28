import discord from "discord.js";
import { createForDay } from "./dayCreation";
import { addAllUsers } from "./addUserToDatabase";
import { getPrisma } from "..";

export async function start(client: discord.Client) {
    setInterval(() => {
        loop(client);
    }, 1000);

    setInterval(() => {
        precenseUpdateLoop(client);
    }, 100 * 100);
}


let currentDay: string;

async function loop(client: discord.Client) {
    if(currentDay !== new Date().toISOString().substring(0, 10).toString()) {
        currentDay = new Date().toISOString().substring(0, 10).toString();
        await addAllUsers(client);
        client.guilds.cache.forEach(async guild => {
            await createForDay(guild);
        });
        console.log("Created new day: " + currentDay);
    }
}

async function precenseUpdateLoop(client: discord.Client) {
    const prisma = await getPrisma();

    const uniqueUsers = await prisma.users.findMany({
        distinct: ["id"]
    });

    // set the bots activity to the amount of unique users
    await client.user.setActivity(`${uniqueUsers.length} users`, { type: discord.ActivityType.Watching });
}