var startingCoord = [37.4, -80];
var startingZoom = 6;

var map = L.map('map', {editInOSMControlOptions: {position: "bottomleft"}
        }).setView(startingCoord, startingZoom);
map.addHash();

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var powerTileUrl = 'http://power.doxu.org/osm_tiles/power/{z}/{x}/{y}.png';
var powerMap = L.tileLayer(powerTileUrl).addTo(map);

var powerErrorTileUrl = 'http://power.doxu.org/osm_tiles/power_error/{z}/{x}/{y}.png';
var powerErrorMap = L.tileLayer(powerErrorTileUrl).addTo(map);

