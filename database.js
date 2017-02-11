const { MongoClient } = require('mongodb');
function recordingSearch(query, date) {
    connect(collection => {
        collection.insert({ 'looking for': query, when: date });
    });
}
function getLastSearches(res) {
    connect(collection => {
        collection.find({}, { _id: 0 }).sort({ date: -1 }).limit(5).toArray((err, items) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: err.name });
            } else {
                res.status(206).json(items);
            }
            res.end();
        });
    })
}
function connect(fn) {
    const dbconstr = process.env.DBConStr0;
    MongoClient.connect(dbconstr, (err, db) => {
        if (err) return console.error(err);
        const collection = db.collection('searches');
        fn(collection);
        db.close();
    });
}

module.exports = { recordingSearch, getLastSearches };
