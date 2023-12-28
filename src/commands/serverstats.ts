import discord from "discord.js";
import { getPrisma } from "..";
import { createGraph } from "../modules/graphGenerator";
import fs from "fs";

export async function getCommandInfo(languageFile: any) {
    const name = languageFile["commands"]["serverstats"]["name"];
    const description = languageFile["commands"]["serverstats"]["description"];

    const options: discord.ApplicationCommandOptionData[] = [];
    const defaultMemberPermissions = [
        "SendMessages"
    ];
    return { name, description, options, defaultMemberPermissions };
}

export async function execute(interaction: discord.CommandInteraction, client: discord.Client, languageFile: any) {
    if(!interaction.isCommand()) return;

    const replyTrans = languageFile["commands"]["serverstats"]["reply"];
    const prismaClient = await getPrisma();

    const guild = await prismaClient.data.findFirst({
        where: {
            guildID: interaction.guild.id
        }
    });

    if(!guild) {
        const embed = new discord.EmbedBuilder()
            .setTitle(replyTrans["errors"]["noStats"]["title"])
            .setDescription(replyTrans["errors"]["noStats"]["description"])
            .setColor(0xff0000)

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
        return
    }

    // get the entries of the last 21 days
    const entries = await prismaClient.data.findMany({
        where: {
            guildID: interaction.guild.id
        },
        orderBy: {
            day: "desc"
        },
        take: 20
    });

    let arr: any = [];

    entries.forEach(entry => {
        arr.push({
            date: entry.day,
            count: entry.count
        });
    });

    const graph = await createGraph(arr);

    fs.writeFileSync("temp.png", graph);

    const attachment = new discord.AttachmentBuilder("temp.png");

    const total = await prismaClient.data.aggregate({
        where: {
            guildID: interaction.guild.id
        },
        _sum: {
            count: true
        }
    });

    const average = await prismaClient.data.aggregate({
        where: {
            guildID: interaction.guild.id
        },
        _avg: {
            count: true
        }
    });

    const best = await prismaClient.data.aggregate({
        where: {
            guildID: interaction.guild.id
        },
        _max: {
            count: true
        }
    });

    const worst = await prismaClient.data.aggregate({
        where: {
            guildID: interaction.guild.id
        },
        _min: {
            count: true
        }
    });

    const totalDays = await prismaClient.data.aggregate({
        where: {
            guildID: interaction.guild.id
        },
        _count: {
            guildID: true
        }
    });

    const embed = new discord.EmbedBuilder()
        .setTitle(replyTrans["title"])
        .setDescription(replyTrans["description"])
        .setColor(0x00ff00)
        .setImage("attachment://temp.png")
        .addFields([
            {
                name: replyTrans["fields"]["total"],
                value: total._sum.count.toString(),
                inline: true
            },
            {
                name: replyTrans["fields"]["average"],
                value: average._avg.count.toString(),
                inline: true
            },
            {
                name: replyTrans["fields"]["best"],
                value: best._max.count.toString(),
                inline: true
            },
            {
                name: replyTrans["fields"]["worst"],
                value: worst._min.count.toString(),
                inline: true
            },
            {
                name: replyTrans["fields"]["totalDays"],
                value: totalDays._count.guildID.toString(),
                inline: true
            }
        ]);
    
    await interaction.reply({
        embeds: [embed],
        files: [attachment],
        ephemeral: true
    });
    
    // delete the temp file
    fs.unlinkSync("temp.png");
}