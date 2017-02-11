const tape = require('tape');
const { request } = require('http');
// const { request } = require('https'); //only remote server
const concat = require('concat-stream');

tape('page up', t => {
    t.plan(1);
    testRequest(res => {
        t.assert(res.statusCode, 200, 'connection OK');
    });
});

tape('response expected normal case', t => {
    t.plan(9);
    const concatStream = concat(takeResult);
    const q = 'lolcats';
    const option = { path: '/search?q=' + q };
    testRequest(option, res => {
        res.pipe(concatStream);
        t.equal(res.statusCode, 206, 'connection OK, patial content');
        t.assert(/application\/json/.test(res.headers['content-type'])
            , 'content type OK');
    });
    function takeResult(data) {
        testResult(data, t, q);
    }
});

tape('response expected offset case', t => {
    t.plan(9);
    const concatStream = concat(takeResult);
    const q = 'trump';
    const option = { path: `/search?q=${q}&offset=2` };
    testRequest(option, res => {
        res.pipe(concatStream);
        t.equal(res.statusCode, 206, 'connection OK, patial content');
        t.assert(/application\/json/.test(res.headers['content-type'])
            , 'content type OK');
    })
    function takeResult(data) {
        testResult(data, t, q);
    }
});

tape('response expected last searches case', t => {
    t.plan(6);
    const concatStream = concat(testResult);
    const option = { path: '/last-searches' };
    testRequest(option, res => {
        res.pipe(concatStream);
        t.equal(res.statusCode, 206, 'connection OK, patial content');
        t.assert(/application\/json/.test(res.headers['content-type'])
            , 'content type OK');
    })
    function testResult(data) {
        try {
            var result = JSON.parse(data);
        } catch (err) {
            return t.end(err);
        }
        const [ first ] = result;
        t.assert(Array.isArray(result), 'got an array');
        t.assert(result.length > 1, 'some results'); //fail in first test
        t.ok(first['looking for'], 'looking-for property found');
        t.ok(first.when, 'when property found');
    }
});

function testResult(data, t, q) {
    try {
        var result = JSON.parse(data);
    } catch (err) {
        return t.end(err);
    }
    const [ first ] = result;
    const { name } = first;
    const regexp = new RegExp(q, 'i');
    t.assert(Array.isArray(result), 'got an array');
    t.equal(result.length, 10, '10 results'); //this can fail in some cases
    t.ok(first.url, 'url property found');
    t.ok(first.thumbnail, 'thumbnail property found');
    t.ok(first['belong to'], 'benlong-to property found');
    t.ok(name, 'name property found');
    t.assert(regexp.test(name), 'search about ' + q);
}

function testRequest() {
    const [first, second] = [...arguments];
    if (!second && typeof first === 'function') {
        requestCase(first);
    }
    if (first && typeof second === 'function') {
        requestCase(second, first);
    }
    // function requestCase(fn , { hostname = 'localhost', port = 8000, path = '/' } = {}) { //server local
    function requestCase(fn, { hostname = 'image-search0.herokuapp.com',
        port = process.env.PORT,
        path = '/'
    } = {}) {
        const req = request({ hostname, port, path }, res => {
            fn(res);
        });
        req.on('error', console.error);
        req.end();
    }
}
