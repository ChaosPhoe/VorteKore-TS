import { GuildMember, BitFieldResolvable, PermissionString, Message } from "discord.js";
export declare function checkPermissions(guildMember: GuildMember, permissions?: BitFieldResolvable<PermissionString>): boolean;
export declare function checkDJ(guildMember: GuildMember): boolean;
export declare function findRole(message: Message, role: string): import("discord.js").Role | undefined;
export declare function formatString(message: string, member: GuildMember): string;
export declare function findMember(message: Message, toFind: string): Promise<GuildMember | null | undefined>;
export declare const get: <T>(url: string, options?: any) => Promise<{
    data: any;
    error: null;
}>;
