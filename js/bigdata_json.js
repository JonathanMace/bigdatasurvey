var getSystemList = function(success, error) {
	var url = "../../json/survey.json";
	$.ajax({
		  dataType: "json",
		  url: url,
		  success: success,
		  error: error
		});
}

var getSystemData = function(systemName, success, error) {
	var url = "../../json/systems/" + systemName + ".json";
	console.log("Loading system", systemName);
	$.ajax({
		  dataType: "json",
		  url: url,
		  success: success,
		  error: error
		});
}

var getPaperData = function(paperName, success, error) {
	var url = "../../json/papers/" + paperName + ".json";
	console.log("Loading paper", paperName);
	$.ajax({
		  dataType: "json",
		  url: url,
		  success: success,
		  error: error
		});
}

var loadBigDataSurveyData = function(callback) {
	systems = {};
	papers = {};
	
	var remaining = 1;
	
	// Track remaining callbacks and call provided callback when done
	var callbackIfNecessary = function() {
		remaining--;
		if (remaining == 0) {
			callback({
				"systems": systems,
				"papers": papers
			});
		}
	}
	
	// Save paper data once loaded
	var onPaperDataLoaded = function(paperData) {
		papers[paperData.id] = paperData;
		callbackIfNecessary();
	};
	
	// Save system data once loaded, and look up papers if necessary
	var onSystemDataLoaded = function(systemData) {
		systems[systemData.id] = systemData;
		for (var i = 0; systemData.papers && i < systemData.papers.length; i++) {
			remaining++;
			getPaperData(systemData.papers[i], onPaperDataLoaded, callbackIfNecessary);
		}
		callbackIfNecessary();
	}
	
	// Load system data for all systems in list
	getSystemList(function(systemList) {
		for (var i = 0; i < systemList.length; i++) {
			remaining++;
			getSystemData(systemList[i], onSystemDataLoaded, callbackIfNecessary);
		}
		callbackIfNecessary();
	});
}

var createGraphFromSurveyData = function(surveyData, params) {
    console.log("Creating graph from survey data", surveyData);
    
    // Create nodes
    console.info("Creating graph nodes");
    var nodes = {};
    for (var id in surveyData.systems) {
    	var node = new Node(id);
    	node.system = surveyData.systems[id];
    	node.survey = surveyData;
    	nodes[id] = node;	
    }
    
    // Second link the nodes together
    console.info("Linking graph nodes");
    for (var nodeid in nodes) {
        var node = nodes[nodeid];
        if (node.system.down) {
        	for (var downid in node.system.down) {
        		if (nodes[downid]) {
        			nodes[downid].addParent(node);
        			node.addChild(nodes[downid]);
        		} else {
        			console.log("No known system " + downid);
        		}
        	}
        }
    }
    
    // Create the graph and add the nodes
    var graph = new Graph();
    for (var id in nodes) {
        graph.addNode(nodes[id]);
    }
    
    console.log("Done creating graph from reports");
    return graph;
}