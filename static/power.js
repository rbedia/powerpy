var startingCoord = [37.4, -80];
var startingZoom = 6;

var map = L.map('map', {editInOSMControlOptions: {position: "bottomleft"}
        }).setView(startingCoord, startingZoom);

var voltColor = d3.scaleOrdinal(d3.schemeCategory10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var powerTileUrl = 'http://power.doxu.org/osm_tiles/{z}/{x}/{y}.png';
var powerMap = L.tileLayer(powerTileUrl, {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

powerMap.opacity = 1.0;

var subsGroup = L.featureGroup().addTo(map);
var linesGroup = L.featureGroup().addTo(map);
var interfacesGroup = L.featureGroup().addTo(map);

var interfaceColorRange = ['#fef0d9','#fdcc8a','#fc8d59','#e34a33','#b30000'];
var interfaceColor = d3.scaleQuantize()
	.domain([0, 100])
	.range(interfaceColorRange);

var defaultSubColor = "#feffd1";

var lmpDomain = [
    -10, 0, 20, 40, 70,
    100, 150, 200, 500
];
var lmpRange = [
    '#6a128d', '#191f71', '#4deffe', '#40ffa0', '#89bd47',
    '#edff12', '#f6e212', '#f8b812', '#f78d12', '#f61f12'
];
var lmpColor = d3.scaleThreshold()
    .domain( lmpDomain )
    .range( lmpRange );

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

function showLimits( limits ) {
    limits = limits.replace( /(\t| {4})/g, "" );
    if (!limits.trim()) {
        limits = "No contingencies.";
    }
    var html = "<pre>" + limits + "</pre>";
    $( "#limits" ).html( html );
}

function showLoad( load ) {
    var table = $( '<table/>' );
    var tbody = $( '<tbody/>' );
    var tr = $( '<tr/>' );
    var th = $( '<th/>' );
    var td = $( '<td/>' );
    var header = tr.clone();

    header.append( th.clone().text( "Area" ) );
    header.append( th.clone().text( "Load" ) );
    table.append( $( '<thead></thead>' ).append( header ) );

    $.each( load, function( key, d ) {
        var row = tr.clone();
        var area = d.area.replace( ' REGION', '' );
        var regionalLoad = d.load + ' MW';
        row.append( td.clone().text( area ) );
        row.append( td.clone().text( regionalLoad ) );
        tbody.append( row );
    });
    $( "#load" ).html( table.append( tbody ) );
}

function showLoadChart() {
    var hours = 7 * 24;

    $.when(
        $.getJSON( "/history/load/" + hours ) 
    ).done( function( history ) {
        var columns = history.columns;

        var chart = c3.generate({
            bindto: '#chart',
            data: {
                x: 'x',
                xFormat: '%Y-%m-%d %H:%M:%S',
                columns: columns
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        culling: {
                            max: 4
                        },
                        count: 7 * 4,
                        format: '%Y-%m-%d %H:%M'
                    }
                },
                y: {
                    label: 'MW'
                }
            },
            grid: {
                x: {
                    show: true
                },
                y: {
                    show: true
                }
            },
            zoom: {
                enabled: true
            }
        });
    });
}

var lastUpdatedControl;
var legendControl;

function loadData() {
    $.when(
        $.getJSON( "/powerlines.json" ),
        $.getJSON( "/pjm" ) 
    ).done( function( powerlinesResult, pjmResult ) {
        var graph = powerlinesResult[0];
        var pjm = pjmResult[0].pjm;

        linesGroup.clearLayers();
        subsGroup.clearLayers();
        interfacesGroup.clearLayers();

        if ( lastUpdatedControl ) {
            map.removeControl( lastUpdatedControl );
        }
        if ( legendControl ) {
            map.removeControl( legendControl );
        }

        lastUpdatedControl = createLastUpdatedControl( pjm );
        map.addControl( lastUpdatedControl );

        var buses = pjm.lmp.reduce( mapBy.bind({key: 'name'}), {} );
        var nodes = graph.nodes.reduce( mapBy.bind({key: 'index'}), {} );
        var interfaces = graph.interfaces.reduce( mapBy.bind({key: 'name'}), {} );

        var lmps = Object.keys(buses).map(function (key) { return parseFloat(buses[key].minute_lmp); });
        var minLMP = d3.min( lmps );
        var maxLMP = d3.max( lmps );

        $.each( graph.links, addPowerline.bind({nodes: nodes}) );
        $.each( pjm.transfer, addTransferInterface.bind({interfaces: interfaces}) );
        $.each( graph.nodes, addBus.bind({buses: buses, lmpColor: lmpColor}) );

        legendControl = createLegend( lmpColor );
        map.addControl( legendControl );

        showLimits( pjm.limits );
        showLoad( pjm.load );

    });

    showLoadChart();
}

loadData();

/*
XXX Disable automatic updates until a solution is found to disable them when focus is lost.
var updateIntervalSec = 5 * 60;
setInterval(loadData, updateIntervalSec * 1000 );
*/
