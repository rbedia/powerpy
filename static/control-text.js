L.Control.Text = L.Control.extend({
    onAdd: function(map) {
        var div = L.DomUtil.create('div', 'control-text');
        div.textContent = this.options.text;


        return div;
    },

    onRemove: function(map) {
    }
});

L.control.text = function(opts) {
    return new L.Control.Text(opts);
}


