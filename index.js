require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlparser = require('url');


const client = new MongoClient(process.env.MONGODB_URL)
const db = client.db("urlshortener")
const urls = db.collection("urls")


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))





app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
  console.log('Request body:', req.body);
  let url = req.body.url;

  if (!url || !/^https?:\/\/.*/i.test(url)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    const myURL = new URL(url); // Parse the URL using the URL class
    const hostname = myURL.hostname; // Extract the hostname

    dns.lookup(hostname, async (err, address) => {
      if (err || !address) {
        return res.json({ error: 'invalid url' });
      }

      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url: url,
        short_url: urlCount,
      };

      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({ original_url: url, short_url: urlCount });
    });
  } catch (err) {
    console.error('Error caught:', err);
    res.json({ error: 'invalid url' });
  }
});

app.get("/api/shorturl/:short_url" , async(req, res)=> {
  const shorturl = req.params.short_url
  const urlDoc = await urls.findOne({short_url: +shorturl})
  res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
