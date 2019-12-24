import { Message } from "discord.js";
import { Command, QueuedSong, VorteEmbed, VorteGuild, VorteMessage, VortePlayer } from "../../lib";
import { paginate } from "../../util";
import ms = require("ms");
import play from "./play";
import { Z_ASCII } from "zlib";

export default class extends Command {
  public constructor() {
    super("queue", {
      category: "Music",
      example: "!queue",
      description: "Shows the current and next up songs."
    });
  }
  
  public async run(message: VorteMessage, [ page ]: [ string ], guild: VorteGuild) {
    const player = <VortePlayer> this.bot.andesite!.players.get(message.guild!.id)!;
    if (!player) return message.sem("The bot isn't in a voice channel.");
    if (!player.queue.np.song) return message.sem(`Hmmmm... the queue is empty, you should some more songs with \`${guild.prefix}play\``);

    let total = player.queue.next.reduce((prev, song ) => prev + song.info.length, 0)
      , paginated = paginate(player.queue.next, parseInt(page || "1"))
      , index = (paginated.page - 1) * 10, upNext = "";

    paginated.items.length
      ? upNext += paginated.items.map(song => `${++index}. **[${song.info.title.trunc(30, true)}](${song.info.uri})** *[<@${song.requester}> ${ms(song.info.length)}]*\n`)
      : upNext = `Hmmmm... pretty empty, you should add some more songs with \`${guild.prefix}play\``      
    if (paginated.maxPage > 1) upNext += '"Use queue <page> to view a specific page."';

    const np = player.queue.np.song!, queueEmbed = new VorteEmbed(message).baseEmbed()
      .setDescription(upNext)
      .addField(`\u200B`, `**Now Playing:**\n**[${np.info.title}](${np.info.uri})** *[<@${np.requester}>]*`)
      .setFooter(paginated.items.length ? `Queue Length: ${ms(total)} | VorteKore` : `VorteKore | ChaosPhoe`);

    message.channel.send(queueEmbed);
  }
}