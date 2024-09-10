const Discord = require("discord.js")
const client = new Discord.Client({intents : 3276799})
const mongoose = require("mongoose")
const points = require("./models/points")
const logId = "1275727718163415071" // ايدي روم اللوق
const DataBase = require("pro.db-arzex")
const status = new DataBase("status.json")
const users = new DataBase("users.json")
const pointsAdmin = "1108379952765743126" // مسؤولين النقاط
const askreh = "1108380057010970684" // رتبة العساكر
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
client.on("ready",async ()=>{
    console.log(`${client.user.tag} is reday !`);
    await mongoose.connect(process.env.db)
})

client.on("messageCreate",async message=>{
    if(message.content == "#setup"){
        if(!message.member.roles.cache.has(pointsAdmin)) return
        let embed = new Discord.EmbedBuilder()
        .setDescription("عزيزي العضو , لتسجل الدخول او الخروج الرجاء استخدام الازرار في الاسفل")
        .setTimestamp()
        .setThumbnail(message.guild.iconURL())
        let row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
            .setLabel("تسجيل دخول")
            .setStyle(Discord.ButtonStyle.Success)
            .setCustomId("login"),
            new Discord.ButtonBuilder()
            .setLabel("تسجيل خروج")
            .setStyle(Discord.ButtonStyle.Danger)
            .setCustomId("logout")
        )
        message.delete()
        message.channel.send({embeds : [embed],components :[row]})
    }
    if(message.content == "#فتح-التسجيل"){
        if(!message.member.roles.cache.has(pointsAdmin)) return
        status.set("st",false)
        message.reply({content :":white_check_mark: | تم فتح التسجيل بنجاح"})
    }
    if(message.content == "#قفل-التسجيل"){
        if(!message.member.roles.cache.has(pointsAdmin)) return
        status.set("st",true)
        message.reply({content :":white_check_mark: | تم قفل التسجيل بنجاح"})
    }

    if(message.content.startsWith("-نقاط") && message.content != "#نقاط الكل"){
        let member = message.mentions.members.first() || message.member
        let data = await points.findOne({user: member.id,guild:message.guild.id})
        if(!data) data = new points({user: member.id,guild:message.guild.id,points:0})
        message.reply({content :`💯 | نقاط العضو ${member} هي : \`${data.points}\``})
    }

    if(message.content == "#تصفير الكل"){
        if(!message.member.roles.cache.has(pointsAdmin)) return
        await points.deleteMany({})
        message.reply({content : "✅ | تم تصفير نقاط جميع المشاركين بنجاح"})
    }

    if(message.content.startsWith("#تصفير ") && message.content != "#تصفير الكل"){
        if(!message.member.roles.cache.has(pointsAdmin)) return
        let user = message.mentions.members.first()
        if(!user) return
        await points.deleteOne({user : user.id,guild: message.guildId})
        message.reply({content : "✅ | تم تصفير نقاط العضو بنجاح"})
    }
    if(message.content.startsWith("#اضافة ")){
        if(!message.member.roles.cache.has(pointsAdmin)) return
        let user = message.mentions.members.first()
        if(!user) return
        let args = message.content.split(" ").filter(x=>x)
        if(!args[2] || isNaN(args[2]) || parseInt(args[2]) <= 0) return message.reply({content : ":x: | ادخل عدد صحيح"})
        let userd = await points.findOne({user: user.id,guild:message.guildId})
    if(!userd) userd = new points({user: user.id,guild:message.guildId,points:0})
    userd.points += parseInt(args[2]);
    await userd.save()
        message.reply({content : "✅ | تم اضافة نقاط للعضو بنجاح"})
    }

    if(message.content.startsWith("#خصم ")){
        if(!message.member.roles.cache.has(pointsAdmin)) return
        let user = message.mentions.members.first()
        if(!user) return
        let args = message.content.split(" ").filter(x=>x)
        if(!args[2] || isNaN(args[2]) || parseInt(args[2]) <= 0) return message.reply({content : ":x: | ادخل عدد صحيح"})
        let userd = await points.findOne({user: user.id,guild:message.guildId})
    if(!userd) userd = new points({user: user.id,guild:message.guildId,points:0})
    userd.points -= parseInt(args[2]);
    await userd.save()
        message.reply({content : "✅ | تم خصم نقاط من العضو بنجاح"})
    }

    if(message.content == "#نقاط الكل"){
        if(!message.member.roles.cache.has(pointsAdmin)) return
        const entriesPerPage = 5;
        let all = await points.find({});
        all = all.sort((a,b)=> b.points - a.points)
        if(all.length == 0) return message.reply({content : ":x: | لا يوجد اعضاء لديهم نقاط"})
        const totalPages = Math.ceil(all.length / entriesPerPage);
        let currentPage = 1;

        const generateEmbed = (page) => {
          const start = (page - 1) * entriesPerPage;
          const end = page * entriesPerPage;
          const entries = all.slice(start, end);

          const embed = new Discord.EmbedBuilder()
            .setTitle('قائمة الصدارة')
            .setDescription(`الصفحة ${page}/${totalPages}`)
            .setColor("DarkBlue");
          let s = entries.map((entry,index) =>`${(index+1) * page} - <@${entry.user}> | points  : ${entry.points}`);
          embed.setDescription(s.join("\n"))
          return embed;
        };

        var row = new Discord.ActionRowBuilder()
          .addComponents(
            new Discord.ButtonBuilder()
              .setCustomId('previous')
              .setLabel('Previous')
              .setStyle(Discord.ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new Discord.ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(Discord.ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages)
          );
        const message1 = await message.reply({
          embeds: [generateEmbed(currentPage)],
          components: [row],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = message1.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
          if (i.customId === 'previous') {
            currentPage--;
          } else if (i.customId === 'next') {
            currentPage++;
          }
          row = new Discord.ActionRow()
          .addComponents(
            new Discord.ButtonBuilder()
              .setCustomId('previous')
              .setLabel('Previous')
              .setStyle(Discord.ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new Discord.ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(Discord.ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages)
          );
          await i.update({
            embeds: [generateEmbed(currentPage)],
            components: [row],
          });
        });

        collector.on('end', () => {
          message1.edit({ components: [] });
        });
    }
})

client.on("interactionCreate",async interaction=>{
    if(!interaction.isButton()) return 
    if(!interaction.member.roles.cache.has(askreh)) return
    if(interaction.customId == "login"){
        await interaction.deferReply({ephemeral:true})
        if(status.get("st")) return interaction.editReply({ephemeral:true, content: ":x: | تسجيل الدخول مقفل حالياً"})
    let user = await points.findOne({user: interaction.user.id,guild:interaction.guildId})
    if(!user) user = new points({user: interaction.user.id,guild:interaction.guildId,points:0})
    if(users.has(interaction.user.id)) return interaction.editReply({content : ":x: | انت مسجل الدخول مسبقا"})
    user.points += 1;
    await user.save()
    users.set(interaction.user.id,"yes")
    interaction.editReply({content : "✅ | تم تسجيل دخولك بنجاح",ephemeral:true})
    client.channels.cache.get(logId).send({
        content: `قام العضو : ${interaction.user}
بتسجيل الدخول واعطاءه 1 نقطة`
    })
}else{
    await interaction.deferReply({ephemeral:true})
    if(status.get("st")) return interaction.editReply({ephemeral:true, content: ":x: | تسجيل الخروج مقفل حالياً"})
    if(!users.has(interaction.user.id)) return interaction.editReply({content : ":x: | انت لست مسجل الدخول مسبقا"})
    users.delete(interaction.user.id)

    interaction.editReply({content : "✅ | تم تسجيل خروجك بنجاح",ephemeral:true})
    client.channels.cache.get(logId).send({
        content: `قام العضو : ${interaction.user}
بتسجيل الخروج`
    })
}
})

client.login(process.env.token)