jQuery.fn.outerHTML = function() {
	return jQuery('<div />').append(this.eq(0).clone()).html();
};

var timestampToTimeString = function(timestamp) {
	timestamp = Math.floor(timestamp);
	var date = new Date(timestamp);
	var hours = date.getHours();
	var minutes = date.getMinutes();
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var seconds = date.getSeconds();
	seconds = seconds < 10 ? '0'+seconds : seconds;
	var milliseconds = date.getMilliseconds();
	milliseconds = milliseconds < 10 ? '00'+milliseconds : milliseconds < 100 ? '0'+milliseconds : milliseconds;
	return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

var DirectedAcyclicGraphTooltip = function(gravity) {

	var tooltip = Tooltip(gravity).title(function(d) {
		var system = d.system;

		function appendRow(key, value, tooltip) {
			var keyrow = $("<div>").attr("class", "key").append(key);
			var valrow = $("<div>").attr("class", "value").append(value);
			var clearrow = $("<div>").attr("class", "clear");
			tooltip.append($("<div>").append(keyrow).append(valrow).append(clearrow));
		}
		
		function makeUrl(url) {
			return $("<a>").attr("href", url).attr("target", "_blank").append(url);
		}

		var tooltip = $("<div>").attr("class", "xtrace-tooltip");
		
		appendRow("", system.name, tooltip);
		appendRow("Homepage", makeUrl(system.url), tooltip);
		if (system.wiki)
			appendRow("Wiki", makeUrl(system.wiki), tooltip);
		appendRow("", $("<div>").attr("width", "100px").append(system.description), tooltip);
			

		return tooltip.outerHTML();
	});

	return tooltip;
}

var DirectedAcyclicGraphEdgeTooltip = function(gravity) {

	var tooltip = Tooltip(gravity).title(function(d) {
		var title = "<b>" + d.source.system.name + " to " + d.target.system.name + "</b>";
		var label = d.source.system.down[d.target.system.id];

		function appendRow(key, value, tooltip) {
			var keyrow = $("<div>").attr("class", "key").append(key);
			var valrow = $("<div>").attr("class", "value").append(value);
			var clearrow = $("<div>").attr("class", "clear");
			tooltip.append($("<div>").append(keyrow).append(valrow).append(clearrow));
		}
		
		function makeUrl(url) {
			return $("<a>").attr("href", url).attr("target", "_blank").append(url);
		}

		var tooltip = $("<div>").attr("class", "xtrace-tooltip");
		appendRow("", title, tooltip);
		appendRow("", label, tooltip);	

		return tooltip.outerHTML();
	});

	return tooltip;
}


var Tooltip = function(gravity) {
	if (gravity==null)
		gravity = $.fn.tipsy.autoWE;

	var tooltip = function(selection) {
		selection.each(function(d) {
			$(this).tipsy({
				gravity: gravity,
				html: true,
				title: function() { return title(d); },
				opacity: 1
			});
		});
	}

	var title = function(d) { return ""; };

	tooltip.hide = function() { $(".tipsy").remove(); }
	tooltip.title = function(_) { if (arguments.length==0) return title; title = _; return tooltip; }


	return tooltip;
}