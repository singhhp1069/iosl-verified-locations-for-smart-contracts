const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const csv = require('fast-csv');
const async = require('async');
const app = express();


//load env vars if .env exists
if (fs.existsSync(path.join(__dirname, './.env'))) {
    dotenv.load();
}

//port and views depending on Node Env
var port;
if (process.env.NODE_ENV === 'production') {
    port = process.env.PORT || 3000;
} else {
    port = process.env.DEV_PORT || 3000;
}


// Async function => use promise to wait for result
function findNearestTower(lon, lat) {
    return new Promise(function(resolve, reject) {

        // To make it faster filter with mobile operator MNC number: http://www.mcc-mnc.com/
        var stream = fs.createReadStream('./res/cell_towers_de_berlin_o2.csv');
        var shortest = 100000000;
        var dist = 0;
        var nearest = [];
        var csvStream = csv
            .parse()
            .on("data", function(row){
                dist = Math.abs(lon - parseFloat(row[6])) + Math.abs(lat - parseFloat(row[7]));
                if (dist < shortest) {
                    shortest = dist;
                    nearest = row;
                }
            })
            .on("end", function(){
                return resolve(nearest);
            });
        stream.pipe(csvStream);
    });
}


// GET - the cell tower nearest to the coordinates given as query params in the url
app.get('/getInArea', function(req, res) {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');

    findNearestTower(req.query.lon, req.query.lat)
        .then(function(cellTower) { // `delay` returns a promise
            res.json(cellTower);
        })
        .catch(function(v) {
            res.send('Error');
        });
});

//listen
app.listen(port, function() {
    console.log('Server is listening on port ' + port + '!');
});
