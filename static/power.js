var startingCoord = [37.4, -80];
var startingZoom = 6;

var map = L.map('map', {editInOSMControlOptions: {position: "bottomleft"}
        }).setView(startingCoord, startingZoom);

var voltColor = d3.scale.category10();

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var powerMap = L.tileLayer('http://power.doxu.org/osm_tiles/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

powerMap.opacity = 0.7;

var subsGroup = L.featureGroup().addTo(map);
var linesGroup = L.featureGroup().addTo(map);
var interfacesGroup = L.featureGroup().addTo(map);

var interfaceColorRange = ['#fef0d9','#fdcc8a','#fc8d59','#e34a33','#b30000'];
var interfaceColor = d3.scale.quantize()
	.domain([0, 100])
	.range(interfaceColorRange);

var defaultSubColor = "#feff81";

function lmpColorGen( minLMP, maxLMP ) {
    var lmpColor;
    if (minLMP > 0) {
        lmpColor = d3.scale.quantize()
            .domain([minLMP, maxLMP])
            .range(["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"]);
    } else {
        lmpColor = d3.scale.quantize()
            .domain([minLMP, minLMP / 2, 0, maxLMP / 2, maxLMP])
            .range(["#1a9641", "#a6d96a", "#ffffbf", "#fdae61", "#d7191c"]);
    }
    return lmpColor;
}

function addPowerline( key, link ) {
    var source = this.nodes[link.source];
    var target = this.nodes[link.target];
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
}

function addTransferInterface( key, trans_limit ) {
    var inter = this.interfaces[trans_limit['interface']];
    if (inter) {
        warn_pct = trans_limit.flow / trans_limit.warning_level * 100;
        trans_pct = trans_limit.flow / trans_limit.transfer_level * 100;
        var line = L.polyline(inter.path, {
            color: interfaceColor(warn_pct),
            weight: 5,
            dashArray: "6, 8",
        }).addTo(interfacesGroup);
        line.bindPopup("Interface: " + trans_limit['interface'] + "<br>" +
            "Flow: " + trans_limit.flow + " MW<br>" +
            "Warning Level: " + trans_limit.warning_level +
            " MW (" + Math.round(warn_pct) + "%)<br>" +
            "Transfer Limit: " + trans_limit.transfer_level +
            " MW (" + Math.round(trans_pct) + "%)");
    }
}

function addBus( key, node ) {
    if (node.lat && node.lon) {
        var bus = this.buses[node.name.toUpperCase()];
        if (!bus) {
            bus = this.buses[node.pjm];
        }
        var circleColor = defaultSubColor;
        var lmpText = "";
        var circleRadius = 5;
        if (bus) {
            circleColor = this.lmpColor(bus.minute_lmp);
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
}

function mapBy( map, obj ) {
    map[obj[this.key]] = obj;
    return map;
}

function createLastUpdatedControl( pjm ) {
    return L.control.text({
        position: 'bottomright',
        text: 'PJM data last updated: ' + pjm.last_updated
    });
}

$.when(
    $.getJSON( "/powerlines.json" ),
    $.getJSON( "/pjm" ) 
).done( function( powerlinesResult, pjmResult ) {
    var graph = powerlinesResult[0];
    var pjm = pjmResult[0].pjm;

    map.addControl( createLastUpdatedControl( pjm ) );

    var buses = pjm.lmp.reduce( mapBy.bind({key: 'name'}), {} );
    var nodes = graph.nodes.reduce( mapBy.bind({key: 'index'}), {} );
    var interfaces = graph.interfaces.reduce( mapBy.bind({key: 'name'}), {} );

    var lmps = Object.keys(buses).map(function (key) { return parseFloat(buses[key].minute_lmp); });
    var minLMP = d3.min( lmps );
    var maxLMP = d3.max( lmps );
    var lmpColor = lmpColorGen( minLMP, maxLMP );

    $.each( graph.links, addPowerline.bind({nodes: nodes}) );
    $.each( pjm.transfer, addTransferInterface.bind({interfaces: interfaces}) );
    $.each( graph.nodes, addBus.bind({buses: buses, lmpColor: lmpColor}) );

    map.addControl(createLegend(lmpColor));
});

/*
$.getJSON( "/limits", function( data ) {
    console.log(data.limits);
    var html = "<pre>" + data.limits + "</pre>";

});
*/

