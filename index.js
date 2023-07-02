const proto = require("./lib/ei_pb")
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const port = process.env.PORT || 3000;
const express = require("express");
const app = express();

const mongoose = require('mongoose');
const schema = new mongoose.model('archive', new mongoose.Schema({ archive: Object }), 'maj')
require('dotenv').config();

app.get(`/submit`, async function (req, res) {
    console.log("submitted")
    try {
        const rinfo = new proto.BasicRequestInfo()
            .setEiUserId(req.query.EID)

        const buffData = Buffer.from(rinfo.serializeBinary()).toString('base64')
        var url = "https://ctx-dot-auxbrainhome.appspot.com/ei_ctx/get_contracts_archive"

        const params = new URLSearchParams();
        params.append('data', buffData);

        var response = await fetch(url, { method: "POST", body: params })

        var text = await response.text()

        if (!text.startsWith("ERROR")) {
            const archive = proto.ContractsArchive.deserializeBinary(proto.AuthenticatedMessage.deserializeBinary(text).getMessage()).toObject()
            await new schema({ archive: archive }).save()
            return res.send("Thank you for submitting your contract archive!<br><br>In case you'd like to take a look, here it is:<br><br>"+JSON.stringify(archive, null, 2))
        } else {
            return res.send("Error decoding this contract archive. Please double check the EID you have submitted!")
        }
    } catch (err) {
        console.log(err)
        return res.send("Error decoding this contract archive. Please double check the EID you have submitted!")
    }
});

app.listen(port, "0.0.0.0", async () => {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI, { keepAlive: true });
    console.log('Connected to DB.');
});


//mongodb+srv://archive_write:EkfmzHRRkSjuW2K8@archive.l9o4gss.mongodb.net/archives
//mongodb+srv://archive_view:ke9Pi8U21eGVCR0U@archive.l9o4gss.mongodb.net/archives