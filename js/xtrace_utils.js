
var window = window ? window : {};
// Problems with resizing and jquery and chrome and this stuff is so dumb.
window.width = function() {
	return document.body.clientWidth;
};

window.height = function() {
	return document.body.clientHeight;
};

// http://stackoverflow.com/questions/523266/how-can-i-get-a-specific-parameter-from-location-search
var getParameter = function(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )
        return "";
    else
        return results[1];
};

var getParameters = function() {
    if (window.location.href.indexOf("?")==-1) return {};
    var param_strs = window.location.href.substr(window.location.href.indexOf("?")+1).split("&");
    var params = {};
    param_strs.forEach(function(str) {
        splits = str.split("=");
        if (splits.length==2) {
            params[splits[0]] = splits[1];
        }
    });
    return params;
};



var createJSONFromVisibleGraph = function(graph) {
    var nodes = graph.getVisibleNodes();
    var reports = [];
    
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var parents = node.getVisibleParents();
        var report = $.extend({}, node.report);
        report["Edge"] = [];
        for (var j = 0; j < parents.length; j++) {
            report["Edge"].push(parents[j].id);
        }
        reports.push(report);
    }
    
    return {"reports": reports};
}


var filter_reports = function(reports, f) {    
    // Figure out which reports have to be removed
    var retained = {};
    var removed = {};
    var reportmap = {};
    for (var i = 0; i < reports.length; i++) {
        var report = reports[i];
        var id = report.EventID;
        reportmap[id] = report;
        if (f(report)) {
            removed[id]=report;
        } else {
            retained[id]=report;
        }
    }

    var remapped = {};
    var num_calculated = 0;
    var remap_parents = function(id) {
        if (remapped[id]) {
            return;
        } else {
            var report = reportmap[id];
            var parents = report["Edge"];
            var newparents = {};
            for (var i = 0; i < parents.length; i++) {
                if (removed[parents[i]]) {
                    remap_parents(parents[i]);
                    reportmap[parents[i]]["Edge"].forEach(function(grandparent) {
                        newparents[grandparent] = true;
                    })
                } else {
                    newparents[parents[i]] = true;
                }
            }
            report["Edge"] = Object.keys(newparents);
            remapped[id] = true;
        }
    }
    
    return Object.keys(retained).map(function(id) {
        remap_parents(id);
        return retained[id];
    })
}