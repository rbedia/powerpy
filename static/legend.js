function createLegend( lmpColor ) {
    var osmPowerLegendStyle = function(color) {
        return {
            "background-color": color,
            "width": "10px",
            "height": "5px",
            "border": "1px solid #333"
        };
    };

    var voltageToColor = [
        ["765", "#66c2a5"],
        ["500", "#ffd92f"],
        ["345", "#a6d854"],
        ["230", "#e78ac3"],
        ["115-161", "#8da0cb"],
        ["69", "#fc8d62"],
        ["34.5", "#e5c494"]
        ];
    var osmPowerLegendElements = voltageToColor.map( function( v2c ) {
        return {
            label: v2c[0] + ' kV',
            html: '',
            style: osmPowerLegendStyle(v2c[1])
        };
    });

    var linesLegendElements = voltColor.domain().map( function( voltage ) {
        return {
            label: voltage + ' kV',
            html: '',
            style: osmPowerLegendStyle(voltColor(voltage))
        };
    });

    var subsLegendElements = lmpColor.range().map( function( color ) {
        var range = lmpColor.invertExtent(color);
        var label;
        if ( typeof range[0] == 'undefined' ) {
            label = '<$' + range[1];
        } else if ( typeof range[1] == 'undefined' ) {
            label = '>$' + range[0];
        } else {
            label = '$' + range[0] + ' - ' + range[1];
        }
        return {
            label: label,
            html: '',
            style: osmPowerLegendStyle(color)
        };
    });
    subsLegendElements.push({
        label: 'No data',
        html: '',
        style: osmPowerLegendStyle(defaultSubColor)
    });

    var interfacesLegendElements = interfaceColorRange.map( function( color ) {
        range = interfaceColor.invertExtent(color);
        return {
            label: range[0] + '% - ' + range[1] + '%',
            html: '',
            style: osmPowerLegendStyle(color)
        };
    });


    return L.control.htmllegend({
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
            elements: subsLegendElements
        }, {
            name: 'Transfer Interfaces',
            layer: interfacesGroup,
            elements: interfacesLegendElements
        }],
        collapsedOnInit: true
    });
}

