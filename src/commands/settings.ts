import discord from "discord.js";
import { getPrisma } from "..";
import { options } from "../types/options";
import path from "path";
import { update } from "../handlers/commandHandler";

const languages = ["en", "de"];

export async function getCommandInfo(languageFile: any) {
    const name = languageFile["commands"]["settings"]["name"];
    const description = languageFile["commands"]["settings"]["description"];

    const options: discord.ApplicationCommandOptionData[] = [
        {
            name: languageFile["commands"]["settings"]["options"]["language"]["name"],
            description: languageFile["commands"]["settings"]["options"]["language"]["description"],
            type: discord.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: languageFile["commands"]["settings"]["options"]["language"]["name"],
                    description: languageFile["commands"]["settings"]["options"]["language"]["description"],
                    type: discord.ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: "English",
                            value: "en"
                        },
                        {
                            name: "German",
                            value: "de"
                        }
                    ]
                }
            ]
        },
        {
            name: languageFile["commands"]["settings"]["options"]["timeout"]["name"],
            description: languageFile["commands"]["settings"]["options"]["timeout"]["description"],
            type: discord.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: languageFile["commands"]["settings"]["options"]["timeout"]["enabled"]["name"],
                    description: languageFile["commands"]["settings"]["options"]["timeout"]["enabled"]["description"],
                    type: discord.ApplicationCommandOptionType.Boolean,
                    required: true
                },
                {
                    name: languageFile["commands"]["settings"]["options"]["timeout"]["duration"]["name"],
                    description: languageFile["commands"]["settings"]["options"]["timeout"]["duration"]["description"],
                    type: discord.ApplicationCommandOptionType.Integer,
                    required: false
                }
            ]
        },
        {
            name: languageFile["commands"]["settings"]["options"]["reactions"]["name"],
            description: languageFile["commands"]["settings"]["options"]["reactions"]["description"],
            type: discord.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: languageFile["commands"]["settings"]["options"]["reactions"]["enabled"]["name"],
                    description: languageFile["commands"]["settings"]["options"]["reactions"]["enabled"]["description"],
                    type: discord.ApplicationCommandOptionType.Boolean,
                    required: true
                }
            ]
        }
    ];
    const defaultMemberPermissions = [
        "ManageGuild"
    ];
    return { name, description, options, defaultMemberPermissions };
}

export async function execute(interaction: discord.ChatInputCommandInteraction, client: discord.Client, languageFile: any) {
    if(!interaction.isCommand()) return;

    const replyTrans = languageFile["commands"]["settings"]["reply"];


    const guild = interaction.guild;
    const prismaClient = await getPrisma();
    const guildSettings = await prismaClient.guild_settings.findFirst({
        where: {
            guild_id: guild.id
        }
    });
    let settings: options = JSON.parse(guildSettings.settings);

    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case languageFile["commands"]["settings"]["options"]["language"]["name"]: {
            const lang = interaction.options.getString(languageFile["commands"]["settings"]["options"]["language"]["name"], true);
            if(!languages.includes(lang)) {
                const embed = new discord.EmbedBuilder()
                    .setTitle(replyTrans["errors"]["language"]["title"])
                    .setDescription(replyTrans["errors"]["language"]["description"])
                    .setColor(0xff0000)

                await interaction.editReply({
                    embeds: [embed]
                });
                return;
            }

            settings.language = lang;

            await prismaClient.guild_settings.update({
                where: {
                    guild_id: guild.id,
                    id: guildSettings.id
                },
                data: {
                    settings: JSON.stringify(settings)
                }
            });

            update(interaction.guild, client);
            break;
        }

        case languageFile["commands"]["settings"]["options"]["timeout"]["name"]: {
            const enabled = interaction.options.getBoolean(languageFile["commands"]["settings"]["options"]["timeout"]["enabled"]["name"], true);
            // check if a duration was provided
            let duration = interaction.options.getInteger(languageFile["commands"]["settings"]["options"]["timeout"]["duration"]["name"], false);
            if(duration) settings.timeoutDuration = duration;
            settings.timeout = enabled;

            await prismaClient.guild_settings.update({
                where: {
                    guild_id: guild.id,
                    id: guildSettings.id
                },
                data: {
                    settings: JSON.stringify(settings)
                }
            });
            break;
        }

        case languageFile["commands"]["settings"]["options"]["reactions"]["name"]: {
            const enabled = interaction.options.getBoolean(languageFile["commands"]["settings"]["options"]["reactions"]["enabled"]["name"], true);
            settings.reactions = enabled;

            await prismaClient.guild_settings.update({
                where: {
                    guild_id: guild.id,
                    id: guildSettings.id
                },
                data: {
                    settings: JSON.stringify(settings)
                }
            });
            break;
        }
    }

    const embed = new discord.EmbedBuilder()
        .setTitle(replyTrans["success"]["title"])
        .setDescription(replyTrans["success"]["description"])
        .setColor(0x00ff00)
        .addFields([
            {
                name: replyTrans["success"]["language"]["name"],
                value: settings.language,
                inline: true
            },
            {
                name: replyTrans["success"]["timeout"]["name"],
                value: settings.timeout.toString(),
                inline: true
            },
            {
                name: replyTrans["success"]["timeoutDuration"]["name"],
                value: settings.timeoutDuration.toString(),
                inline: true
            },
            {
                name: replyTrans["success"]["reactions"]["name"],
                value: settings.reactions.toString(),
                inline: true
            }
        ])

    await interaction.editReply({
        embeds: [embed]
    });

}