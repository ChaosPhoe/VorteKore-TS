import { GuildMember, TextChannel } from "discord.js";
import { Event } from "../../lib";
import { formatString } from "../../util";

export default class extends Event {
  public constructor() {
    super("member-leave", {
      category: "guild",
      event: "guildMemberRemove"
    });
  }

  async run(member: GuildMember) {
    const guild = await this.bot.database.getGuild(member.guild.id);
    const channel = guild.logs.memberJoined;
    if (!channel) return;

    const welcomeChannel = (member.guild.channels.get(channel) as TextChannel);
    if (!welcomeChannel) return;

    welcomeChannel.send(formatString(guild.farewellMessage, member));
  };
}