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
			tooltip.append($("<div>").attr("class", "tooltiprow").append(keyrow).append(valrow).append(clearrow));
		}
		
		function makeUrl(url) {
			return $("<a>").attr("href", url).attr("target", "_blank").append(url);
		}

		var tooltip = $("<div>").attr("class", "xtrace-tooltip");
		
		appendRow("", "<b>" + system.name + "</b>", tooltip);
		appendRow("Homepage", makeUrl(system.url), tooltip);
		if (system.wiki)
			appendRow("Wiki", makeUrl(system.wiki), tooltip);
		if (system.git)
			appendRow("GitHub", makeUrl(system.git), tooltip);
		appendRow("", $("<div>").attr("width", "200px").append(system.description), tooltip);
			

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
			tooltip.append($("<div>").attr("class", "tooltiprow").append(keyrow).append(valrow).append(clearrow));
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

var InfoTooltip = function() {

	var gravity = $.fn.tipsy.autoBounds(0, "nw");
	var tooltip = Tooltip(gravity, "info").title(function() {
		var tooltip = $("<div>").attr("class", "info-tooltip");
		console.log("tooltip");

		function appendRow(key, value, tooltip) {
			var keyrow = $("<div>").attr("class", "key").append(key);
			var valrow = $("<div>").attr("class", "value").append(value);
			var clearrow = $("<div>").attr("class", "clear");
			tooltip.append($("<div>").attr("class", "inforow").append(keyrow).append(valrow).append(clearrow));
		}
		
		var wip = "This page is a work in progress";
		var description1 = "What \"Big Data\" systems exist out there?";
		var description2 = "How do they interact with each other?";
		var usage = "Hover over nodes to see system descriptions.";
		var usage2 = "Hover over edges for information on how two systems interact.";
		var usage3 = "Right-click nodes to show / hide different systems";
		var about = "This was hacked together by <a href=\"http://cs.brown.edu/people/jcmace\">Jonathan Mace</a>";
		var about2 = "Corrections and additions welcome at <a href=\"http://www.github.com/JonathanMace/bigdatasurvey\">GitHub</a>";

		var space = "<div style='padding-bottom: 10px'></div>";
		
		appendRow("", "<i>Work in Progress</i>", tooltip);
		appendRow("", space, tooltip);
		
		appendRow("", description1, tooltip);
		appendRow("", description2, tooltip);
		appendRow("", space, tooltip);
		
		appendRow("", usage, tooltip);
		appendRow("", usage2, tooltip);
		appendRow("", usage3, tooltip);
		appendRow("", space, tooltip);
		
		appendRow("", about, tooltip);
		appendRow("", about2, tooltip);

		return tooltip.outerHTML();
	});

	return tooltip;
}


var Tooltip = function(gravity, className) {
	if (gravity==null)
		gravity = $.fn.tipsy.autoWE;

	var tooltip = function(selection) {
		selection.each(function(d) {
			$(this).tipsy({
				gravity: gravity,
				html: true,
				title: function() { return title(d); },
				opacity: 1,
				className: className,
			});
		});
	}

	var title = function(d) { return ""; };

	tooltip.hide = function() { $(".tipsy").remove(); }
	tooltip.title = function(_) { if (arguments.length==0) return title; title = _; return tooltip; }


	return tooltip;
}