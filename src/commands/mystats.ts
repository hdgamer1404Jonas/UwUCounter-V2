import discord from "discord.js";
import { getPrisma } from "..";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import { createGraph } from "../modules/graphGenerator";

export async function getCommandInfo(languageFile: any) {
    const name = languageFile["commands"]["mystats"]["name"];
    const description = languageFile["commands"]["mystats"]["description"];

    const options: discord.ApplicationCommandOptionData[] = [];
    const defaultMemberPermissions = [
        "SendMessages"
    ];
    return { name, description, options, defaultMemberPermissions };
}

export async function execute(interaction: discord.CommandInteraction, client: discord.Client, languageFile: any) {
    if(!interaction.isCommand()) return;

    const replyTrans = languageFile["commands"]["mystats"]["reply"];
    const prismaClient = await getPrisma();

    const user = await prismaClient.users.findFirst({
        where: {
            id: interaction.user.id
        }
    });

    if(!user) {
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

    // get all entries
    const entries = await prismaClient.users.findMany({
        where: {
            id: interaction.user.id
        },
        orderBy: {
            date: "desc"
        },
        take: 20
    });

    let arr: any = [];

    entries.forEach(entry => {
        arr.push({
            date: entry.date,
            count: entry.count
        });
    });

    const graph = await createGraph(arr);

    fs.writeFileSync("temp.png", graph);

    const attachment = new discord.AttachmentBuilder("temp.png");

    const total = await prismaClient.users.aggregate({
        where: {
            id: interaction.user.id
        },
        _sum: {
            count: true
        }
    });

    const average = await prismaClient.users.aggregate({
        where: {
            id: interaction.user.id
        },
        _avg: {
            count: true
        }
    });

    const best = await prismaClient.users.aggregate({
        where: {
            id: interaction.user.id
        },
        _max: {
            count: true
        }
    });

    const worst = await prismaClient.users.aggregate({
        where: {
            id: interaction.user.id
        },
        _min: {
            count: true
        }
    });

    const totalDays = await prismaClient.users.aggregate({
        where: {
            id: interaction.user.id
        },
        _count: {
            id: true
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
                value: totalDays._count.id.toString(),
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