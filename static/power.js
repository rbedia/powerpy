var startingCoord = [37.4, -80];

var map = L.map('map', {editInOSMControlOptions: {position: "bottomleft"}
        }).setView(startingCoord, 6);

var voltColor = d3.scale.category10();

var osmMap = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var powerMap = L.tileLayer('http://aqua.trillinux.org:8080/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

powerMap.opacity = 0.7;

var subsGroup = L.featureGroup().addTo(map);
var linesGroup = L.featureGroup().addTo(map);
var interfacesGroup = L.featureGroup().addTo(map);

var interfaceColor = "#238b45"

var nodes = {};

$.getJSON( "graph.json", function( graph ) {
    $.getJSON( "/powerpy/lmp", function( lmp ) {
        system = lmp.lmp;
        var buses = {};
        $.each( system, function( key, node ) {
            buses[node.name] = node;
        });
        var busesArr = Object.keys(buses).map(function (key) { return buses[key]; });
        var minLMP = d3.min( busesArr, function(d) { return parseFloat(d.minute_lmp); });
        var maxLMP = d3.max( busesArr, function(d) { return parseFloat(d.minute_lmp); });
        var lmpColor;
        if (minLMP > 0) {
            lmpColor = d3.scale.quantize()
                .domain([minLMP, maxLMP])
                .range(["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"]);
        } else {
            lmpColor = d3.scale.quantize()
                .domain([minLMP, 0, maxLMP])
                .range(["#1a9641", "#a6d96a", "#ffffbf", "#fdae61", "#d7191c"]);
        }

        $.each( graph['nodes'], function( key, node ) {
            nodes[node.index] = node;
        });

        $.each( graph['links'], function( key, link ) {
            var source = nodes[link.source];
            var target = nodes[link.target];
            if (source.lat && source.lon && target.lat && target.lon) {
                var path = [[source.lat, source.lon], [target.lat, target.lon]];
                var line = L.polyline(path, {color: voltColor(link.voltage)}).addTo(linesGroup);
                var text = source.name + " - " + target.name + " " + link.voltage + " kV" +
                    "<br>" + link.length + " mi";
                if (link.ref) {
                    text = link.ref + " " + text;
                }
                line.bindPopup(text);
            }
        });

        var interfaces = {};
        $.each( graph['interfaces'], function( key, node ) {
            interfaces[node.name] = node;
        });
        $.getJSON( "/powerpy/transfer", function( transfer ) {
            trans_limits = transfer.transfer;
            $.each( trans_limits, function( key, trans_limit ) {
                var inter = interfaces[trans_limit['interface']];
                if (inter) {
                    var line = L.polyline(inter.path, {
                        color: interfaceColor,
                        weight: 5,
                        dashArray: "6, 8",
                    }).addTo(interfacesGroup);
                    warn_pct = trans_limit.flow / trans_limit.warning_level * 100;
                    trans_pct = trans_limit.flow / trans_limit.transfer_level * 100;
                    line.bindPopup("Interface: " + trans_limit['interface'] + "<br>" +
                        "Flow: " + trans_limit.flow + " MW<br>" +
                        "Warning Level: " + trans_limit.warning_level +
                        " MW (" + Math.round(warn_pct) + "%)<br>" +
                        "Transfer Limit: " + trans_limit.transfer_level +
                        " MW (" + Math.round(trans_pct) + "%)");
                }
            });
        });

        $.each( graph['nodes'], function( key, node ) {
            if (node.lat && node.lon) {
                var bus = buses[node.name.toUpperCase()];
                if (!bus) {
                    bus = buses[node.pjm];
                }
                var circleColor = "#fff";
                var lmpText = "";
                var circleRadius = 5;
                if (bus) {
                    circleColor = lmpColor(bus.minute_lmp);
                    lmpText = "<br>5 Minute LMP: " + bus.minute_lmp;
                    circleRadius = 7;
                }

                L.circleMarker(
                        [node.lat, node.lon],
                        {
                            color: "#333",
                            weight: 1,
                            fillColor: circleColor,
                            fillOpacity: 1,
                            radius: circleRadius
                        })
                        .addTo(subsGroup)
                        .bindPopup(node.name + lmpText);
            }
        });

        var osmPowerLegendStyle = function(color) {
            return {
                "background-color": color,
                "width": "10px",
                "height": "5px",
                "border": "1px solid #333"
            };
        };

        var osmPowerLegendElements = [];
        var voltageToColor = [
            ["765", "#66c2a5"],
            ["500", "#ffd92f"],
            ["345", "#a6d854"],
            ["230", "#e78ac3"],
            ["115-161", "#8da0cb"],
            ["69", "#fc8d62"],
            ["34.5", "#e5c494"]
            ];
        $.each(voltageToColor, function( key, v2c ) {
            osmPowerLegendElements.push({
                label: v2c[0] + ' kV',
                html: '',
                style: osmPowerLegendStyle(v2c[1])
            });
        });

        var linesLegendElements = [];
        $.each(voltColor.domain(), function( key, v ) {
            linesLegendElements.push({
                label: v + ' kV',
                html: '',
                style: osmPowerLegendStyle(voltColor(v))
            });
        });

        var htmlLegend1 = L.control.htmllegend({
            position: 'topright',
            legends: [{
                name: 'OSM Power',
                layer: powerMap,
                elements: osmPowerLegendElements
            }, {
                name: 'Power lines',
                layer: linesGroup,
                elements: linesLegendElements
            }, {
                name: 'Substations',
                layer: subsGroup,
                elements: []
            }, {
                name: 'Interfaces',
                layer: interfacesGroup,
                elements: [{
                    label: 'Transfer interface',
                    html: '',
                    style: {
                        "background-color": interfaceColor,
                        "width": "10px",
                        "height": "5px",
                        "border": "1px solid #333"
                    }
                }]
            }],
            collapsedOnInit: true
        });

        map.addControl(htmlLegend1);

    });
});

/*
$.getJSON( "/powerpy/limits", function( data ) {
    console.log(data.limits);
    var html = "<pre>" + data.limits + "</pre>";

});
*/

