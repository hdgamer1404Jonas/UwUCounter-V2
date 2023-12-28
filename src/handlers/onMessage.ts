import discord from "discord.js";
import { getPrisma } from "..";

export async function onMessage(message: discord.Message, client: discord.Client) {
    if (!(message.author.id === "531177210779009025")) return;
    if(!(message.content.startsWith("!"))) return;

    const content = message.content.substring(1).split(" ");
    const command = content[0];

    switch(command) {
        case "echo": {
            message.channel.send(content.slice(1).join(" "));
            break;
        }

        case "eval": {
            try {
                message.channel.send(eval(content.slice(1).join(" ")));
            }catch(e) {
                message.channel.send(e.message);
            }
            break;
        }
    }
}