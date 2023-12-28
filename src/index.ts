import discord from "discord.js";
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from "@prisma/client/runtime/library";
import { updateAll, execute } from "./handlers/commandHandler";
import { onGuildCreate } from "./handlers/guildCreate";
import { onUWU } from "./handlers/onUwU";
import { start } from "./modules/loop";
import { detect } from "./modules/timeoutDetection";
import { addAllUsers } from "./modules/addUserToDatabase";
import { onMessage } from "./handlers/onMessage";
import { validateDB } from "./modules/validiateDB";

const config = require("./config.json");
let prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;

export function getPrisma() {
    return prisma;
}

const client = new discord.Client({
    intents: [
        discord.GatewayIntentBits.Guilds,
        discord.GatewayIntentBits.GuildMessages,
        discord.GatewayIntentBits.GuildMessageReactions,
        discord.GatewayIntentBits.GuildMessageTyping,
        discord.GatewayIntentBits.DirectMessages,
        discord.GatewayIntentBits.DirectMessageReactions,
        discord.GatewayIntentBits.DirectMessageTyping,
        discord.GatewayIntentBits.MessageContent,
        discord.GatewayIntentBits.GuildMembers
    ]
});

client.on("ready", async () => {
    prisma = new PrismaClient();
    
    await validateDB(client, prisma);
    await updateAll(client);
    start(client);
    
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot is in ${client.guilds.cache.size} servers:`);
    console.table(client.guilds.cache.map(guild => {
        return {
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount
        }
    }));

    // get the amount of unique users in the database
    const uniqueUsers = await prisma.users.findMany({
        distinct: ["id"]
    });

    // set the bots activity to the amount of unique users
    await client.user.setActivity(`${uniqueUsers.length} users`, { type: discord.ActivityType.Watching });

});

client.on("interactionCreate", async (interaction: discord.ChatInputCommandInteraction) => {
    if(!interaction.isCommand()) return;

    await execute(interaction, client);
});

client.on("guildCreate", async (guild: discord.Guild) => {
    await onGuildCreate(guild);
});

client.on("messageCreate", async (message: discord.Message) => {
    if(message.content.toLowerCase().includes("uwu")) {
        await onUWU(message, client);
        await detect(message, client);
    }
    
    await onMessage(message, client);
})

client.login(config.discord.token);
