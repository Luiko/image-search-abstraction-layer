const express = require('express');
const { request } = require('https');
const concat = require('concat-stream');
const { recordingSearch, getLastSearches } = require('./database');

const app = express();
app.set('port', process.env.PORT || 8000);
app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', (req, res) => {
    const options = {
        title: 'Image Search Abstraction Layer',
        url: 'localhost:8000',
        searchPath: 'search?q=lolcats',
        lotPath: 'search?q=lolcats&offset=2',
        recentSearches: 'last-searches'
    }
    res.render('index', options);
});

app.get('/search', (req, res) => {
    const query = req.query;
    getImagesSearch(res, query);
});

app.get('/last-searches', (_, res) => {
    getLastSearches(res);
});

app.listen(app.get('port'), () => {
    console.log("server listening in port " + app.get('port'));
});

function getImagesSearch(response, { q = 'lolcats', offset = 0 } = {}) {
    const regexp = /[^](https?:\/\/.+)&p/;
    const concatStream = concat(handleData);
    try {
        var path = `/bing/v5.0/images/search?q=${q}&count=10&offset=${offset}&mkt=en-us&safeSearch=off`;
    } catch (error) {
        return response.status(500).send(error.message);
    }
    const options = {
        protocol: 'https:',
        hostname: 'api.cognitive.microsoft.com',
        path,
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_KEY
        }
    }
    const req = request(options, res => res.pipe(concatStream));
    req.on('error', console.error);
    req.end();
    recordingSearch(q, new Date);

    function handleData(data) {
        let results = JSON.parse(data).value;
        results = results.map(val => {
            try {
                const { name, contentUrl, hostPageUrl, thumbnailUrl } = val;
                const [, url] = regexp.exec(decodeURIComponent(contentUrl));
                const [, belongto] = regexp.exec(decodeURIComponent(hostPageUrl)); 
                return { url, name, 'belong to': belongto , thumbnail: thumbnailUrl };
            } catch(err) {
                console.error(err);
                return err.name;
            }
        });
        try {
            response.status(206).json(results);
        } catch (err) {
            console.error(err);
        }
    }
}
