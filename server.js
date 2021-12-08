require('dotenv').config();
const express = require('express');
const app = express();

const dns = require("dns");
const url = require("url");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

app.use(express.static('public'));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use("/api/shorturl", bodyParser.urlencoded({"extended": false}));

const urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true, trim: true},
  short_url: {type: Number, required: true}
});
const Url = mongoose.model("Url", urlSchema);

app.post("/api/shorturl", (req, res) => {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  if (urlRegex.test(req.body.url)){
    urlParsed = new URL(req.body.url);
  } else {
    res.json({"error": "invalid url"});
    return;
  };

  dns.lookup(urlParsed.hostname, (err, address) => {
    if(!address) {
      res.json({"error": "invalid url"});
    } else {
      const findUrl = Url.findOne({original_url: req.body.url}, (err, data) => {
        if(data) {
          res.json({"original_url": req.body.url, "short_url": data.short_url});
        } else {
          const create = async () => {
            try {
              const index = await Url.countDocuments();
              const urlDocument = new Url({
                "original_url": req.body.url,
                "short_url": index + 1
              });
              urlDocument.save((err, data) => {
                console.log("url saved");
                return data;
              });
              res.json({"original_url": req.body.url, "short_url": index + 1});
            } catch(error) {
              console.log(error);
            };
          };
          create();
        };
      });
    };
  });
});

app.get("/api/shorturl/:short", (req, res) => {
  if(req.params.short) {
    const findShortUrl = Url.findOne({short_url: req.params.short}, (err, data) => {
      if(data) {
        res.redirect(data.original_url);
      };
    });
  };
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
