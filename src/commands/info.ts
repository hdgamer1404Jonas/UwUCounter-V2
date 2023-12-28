import discord from "discord.js";

export async function getCommandInfo(languageFile: any) {
    const name = languageFile["commands"]["info"]["name"];
    const description = languageFile["commands"]["info"]["description"];

    const options: discord.ApplicationCommandOptionData[] = [];
    const defaultMemberPermissions = [
        "SendMessages"
    ];
    return { name, description, options, defaultMemberPermissions };
}

export async function execute(interaction: discord.CommandInteraction, client: discord.Client, languageFile: any) {
    if(!interaction.isCommand()) return;

    const replyTrans = languageFile["commands"]["info"]["reply"];

    const embed = new discord.EmbedBuilder()
        .setTitle(replyTrans["title"])
        .addFields([
            {
                name: replyTrans["version"],
                value: "v3.0.0",
                inline: true
            },
            {
                name: replyTrans["guilds"],
                value: client.guilds.cache.size.toString(),
                inline: true
            },
            {
                name: replyTrans["author"],
                value: "hdgamer1404jonas",
                inline: true
            },
            {
                name: replyTrans["website"],
                value: "coming soon",
                inline: true
            },
            {
                name: replyTrans["invite"],
                value: "https://discord.gg/AkEEa4DDnS",
                inline: true
            },
        ])
        .setColor(0x00ff00)

    await interaction.reply({
        embeds: [embed]
    });

}
