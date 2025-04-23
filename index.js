const readline = require("readline");
const fs = require("fs");
const crypto = require("crypto");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const algorithm = "aes-256-cbc";
const key = crypto.scryptSync("senin-sifren-burada-zyp", "salt", 32);
const iv = Buffer.alloc(16, 0);

function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

function decrypt(encrypted) {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

(async () => {
    console.log("1. Eski verileri yükle\n2. Yeni verileri gir");
    const choice = await ask("Seçimin (1/2): ");

    let config = {};

    if (choice === "1" && fs.existsSync("./config.json")) {
        const raw = fs.readFileSync("./config.json", "utf-8");
        config = JSON.parse(decrypt(raw));
        console.log("🔓 verileri çok profesyonelce yükledim.");
    } else {
        config.token = await ask("🔑 Bot Token: ");
        config.guildId = await ask("Sunucu ID: ");
        config.roleId = await ask("Rol ID: ");
        config.logChannelId = await ask("📝 Log Kanalı ID: ");
        config.watchWord = await ask(" Aranacak kelime (örn: zypheris): ");
        config.statusText = await ask(" Botun özel durumu: ");
        config.statusType = await ask("🟢 Durum tipi (online/dnd/idle/invisible): ");

        fs.writeFileSync("./config.json", encrypt(JSON.stringify(config)));
        console.log("sen rahat ol reis Verileri çok güvenlice kaydettim şifreledim (❁´◡`❁)");
    }

    rl.close();

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildMembers
        ]
    });

    client.once("ready", () => {
        console.log(` ${client.user.tag} olarak giriş yapıldı`);
        client.user.setPresence({
            activities: [{ name: config.statusText }],
            status: config.statusType
        });
    });

    const loggedUsers = new Set();

    client.on("presenceUpdate", async (_, newPresence) => {
        const member = newPresence.member;
        if (!member || !member.guild || newPresence.guild.id !== config.guildId) return;

        const activities = newPresence.activities || [];
        const hasWatchWord = activities.some(act =>
            act.state?.toLowerCase().includes(config.watchWord.toLowerCase()) ||
            act.name?.toLowerCase().includes(config.watchWord.toLowerCase())
        );

        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return;

        const role = guild.roles.cache.get(config.roleId);
        const logChannel = guild.channels.cache.get(config.logChannelId);

        if (!role || !logChannel) return;

        if (hasWatchWord && !member.roles.cache.has(role.id) && !loggedUsers.has(member.id)) {
            await member.roles.add(role).catch(() => {});
            const embed = new EmbedBuilder()
                .setTitle(" <:onayzyp:1364519939825995858>  Rol Verildi")
                .setDescription(`${member.user.tag} kullanıcısına **${role.name}** rolü verildi!`)
                .setColor("Yellow");
            logChannel.send({ embeds: [embed] });
            loggedUsers.add(member.id);
        } else if (!hasWatchWord && member.roles.cache.has(role.id)) {
            await member.roles.remove(role).catch(() => {});
            const embed = new EmbedBuilder()
                .setTitle("<:zyprol:1364520027675557888> Rol Alındı")
                .setDescription(`${member.user.tag} kullanıcısından **${role.name}** rolü alındı.`)
                .setColor("Red");
            logChannel.send({ embeds: [embed] });
            loggedUsers.delete(member.id);
        }
    });

    client.login(config.token);
})();
