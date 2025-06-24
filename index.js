require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleSpreadsheet } = require("google-spreadsheet");

// Init Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on("ready", () => {
  console.log(`Bot đã đăng nhập với tên ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!add ")) {
    const [, noidung, deadline] = message.content.split("|").map(i => i.trim());
    if (!noidung || !deadline) return message.reply("Cú pháp: `!add nội dung | deadline`");

    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GS_CLIENT_EMAIL,
      private_key: process.env.GS_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.addRow({ Nhiệm_vụ: noidung, Deadline: deadline, Trạng_thái: "chưa hoàn thành" });

    message.reply(`✅ Đã thêm công việc: ${noidung} (hạn: ${deadline})`);
  }

  if (message.content.startsWith("!done ")) {
    const [, noidung] = message.content.split("!done ");
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GS_CLIENT_EMAIL,
      private_key: process.env.GS_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells();

    const rows = await sheet.getRows();
    const row = rows.find(r => r.Nhiệm_vụ === noidung.trim());

    if (!row) return message.reply("Không tìm thấy nhiệm vụ!");

    row.Trạng_thái = "hoàn thành";
    await row.save();

    message.reply(`🎉 Đã cập nhật trạng thái: ${noidung.trim()}`);
  }
});

client.login(process.env.TOKEN);
