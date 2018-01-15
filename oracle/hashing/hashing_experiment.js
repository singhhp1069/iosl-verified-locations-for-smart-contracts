var geohashpoly = require('geohash-poly');
const geoarea = require('geo-area')(/*options*/{x: 'lng', y: 'lat'});
var Chart = require("chart.js");
var fs = require("fs");
var geohash = require("latlon-geohash");
var readline = require('readline');

function getDistanceFromLatLonInKm(location1, location2) {
    lat1 = location1[0];
    lon1 = location1[1];
    lat2 = location2[0];
    lon2 = location2[1];

    var R = 6371;
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
}

function calculateArea(geofence_normal){
    //calculate area for irregular polygon
    var geofence = geofence_normal.reverse();

    var polygon = [];
    for (var t = 0; t < geofence.length; t++) {

        polygon.push({lng: geofence[t][1], lat: geofence[t][0]});
    }
    return geoarea(polygon) / 1000000;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function rad2deg(rad) {
    return rad * 180 / Math.PI;
}

function getPointsFromHash(hashes) {
    points = [];

    for(i=0; i < hashes.length; i++){

        bounds = geohash.bounds(hashes[i]);
        lat1 = bounds["sw"]["lat"];
        lon1 = bounds["sw"]["lon"];
        lat2 = bounds["ne"]["lat"];
        lon2 = bounds["ne"]["lon"];

        points.push(lat1);points.push(lon1);points.push(lat2);points.push(lon1);
        points.push(lat2);points.push(lon2);points.push(lat1);points.push(lon2);
    }


    return points
}

function findCommonPrefix(hashes, length) {

    if(hashes[0] == undefined) return "";
    prefix = "";
    minLength = hashes[0].length;
    for(i = 0; i < hashes.length; i++){
        if(minLength < hashes[i].length){
            minLength = hashes[i].length
        }
    }

    for (j = 0; j < minLength; j++) {
        newPrefix = true;
        for(i = 0; i < hashes.length - 1; i++){
            if (hashes[i].charAt(j) != hashes[i + 1].charAt(j)) {
                newPrefix = false;
            }
        }
        if(newPrefix) prefix = hashes[0].substring(0, j+1);
    }

    return prefix;
}

function findWithPrefix(hashes, prefix) {

    prefixLenght = prefix.length;
    count = 0;
    for(i = 0; i < hashes.length; i++){
       if(hashes[i].substring(0, prefixLenght) == prefix){
           count += 1;
       }
    }
    return count;
}

function findCompressedCells(hashes) {

    if(hashes[0] == undefined) return hashes;
    compressedCells = [];

    commonPrefix = findCommonPrefix(hashes);
    rest = 6 - commonPrefix.length;
    base32chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'j', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
        'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    for(j = 0; j < 36; j++){
        checkprefix = commonPrefix + base32chars[j];
        c = findWithPrefix(hashes, checkprefix);
        prefix_length = checkprefix.length;
        diff = hashes[0].length - prefix_length - 1;

        if(c == Math.pow(32, diff)){
            compressedCells.push(checkprefix)
        }
        else{
            for(m = 0; m < 36; m++){
                new_prefix = checkprefix + base32chars[m];
                c = findWithPrefix(hashes, new_prefix);

                diff = hashes[0].length - prefix_length - 1;
                if(c == Math.pow(32, diff)){
                    compressedCells.push(new_prefix);
                }
            }
        }
    }

    removable = [];
    for(i = 0; i < compressedCells.length; i++){
        compressed = compressedCells[i];
        for(j = 0; j < hashes.length; j++){
            hash = hashes[j];
            if(hash.substring(0, compressed.length) == compressed){
                removable.push(hash);
            }
        }
        hashes.push(compressed);
    }
    for(i = 0; i < removable.length; i++){
        const index = hashes.indexOf(removable[i]);
        hashes.splice(index, 1);
    }
    return [hashes, compressedCells.length];
}

var sync = require("sync");

/*
* GeoHash FUNCTIONS
 */

function hashToString(poly) {

    var geohash_geofence = poly;
    geohash_geofence.push(geohash_geofence[0]);
    var g_final = [];
    if(g_final.push(geohash_geofence)){

        geohashpoly({coords: g_final, precision: 6, hashMode: "inside" }, function (err, hashes) {
            o = findCompressedCells(hashes);
            hashes = o[0];
            compressed_count = o[1];

            geofence_area = calculateArea(poly);
            hashes_count = hashes.length;
            area_covered = (hashes.length - compressed_count) * 0.72 + compressed_count * 23.04;
            bits_needed = (hashes.length - compressed_count) * 24 + compressed_count * 20;
            fence_edges = poly.length;

            /*var stream_hashed = fs.createWriteStream("output/hashed_fences.txt", {'flags': 'a'});
            stream_hashed.once('open', function(fd) {
                stream_hashed.write(hashes + "\n");
                stream_hashed.end();
            });*/

            var stream_points = fs.createWriteStream("output/fences_points.txt", {'flags': 'a'});
            stream_points.once('open', function(fd) {
                stream_points.write(getPointsFromHash(hashes) + "\n");
                stream_points.end();
            });

            var stream_info = fs.createWriteStream("output/fences_info.txt", {'flags': 'a'});
            stream_info.write(hashes_count + ", " + area_covered + ", " + bits_needed +
                    ", " + geofence_area + ", " + fence_edges + "\n");
                stream_info.end();

            console.log("Number of cells " + hashes_count);
            console.log("Area covered " + area_covered);
            console.log("Bits needed " + bits_needed);
            console.log("Real Area covered " + geofence_area);
            console.log("Fence Edges " + fence_edges);
        });
    }
}

/*
* Main Function
 */

function main() {

    num_geofences = 10;

    geohash_cells = [];
    geohash_area_diffs = [];
    geohash_area = [];

    var rd = readline.createInterface({
        input: fs.createReadStream('output/fences.txt'),
        output: process.stdout,
        console: false
    });

    fences = [];
    rd.on('line', function(line) {
        cords = line.split(",");
        for(i = 0; i < cords.length; i++){
            cords[i] = parseFloat(cords[i])
        }
        new_fence = [];
        for(i = 0; i < cords.length; i += 2){
            new_fence.push([cords[i], cords[i+1]])
        }
        geohash_polygon = hashToString(new_fence, num_geofences, geohash_cells, geohash_area_diffs, geohash_area);
    });
}

main();
