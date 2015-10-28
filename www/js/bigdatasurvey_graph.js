function BigDataGraph(attachPoint, surveyData, /*optional*/ params) {
    var dag = this;
    
    // Twiddle the attach point a little bit
    var rootSVG = d3.select(attachPoint).append("svg").attr("width", "100%").attr("height", "100%");
    var graphSVG = rootSVG.append("svg").attr("width", "100%").attr("height", "100%").attr("class", "graph-attach");
    graphSVG.node().oncontextmenu = function(d) { return false; };
    var minimapSVG = rootSVG.append("svg").attr("class", "minimap-attach");
    var listSVG = rootSVG.append("svg").attr("class", "history-attach");
    
    
    // Set up the "About" info tooltip
    var infoTooltip = InfoTooltip();
    var infoHover = rootSVG.append("g").attr("transform", "translate(25,25)").classed("infohover", true);
    var infoCircle = infoHover.append("circle").attr("r", 20);
    infoHover.append("text").attr("text-anchor", "middle").attr("x", 0)
             .append("tspan").attr("x", 0).attr("dy", "0.35em").attr("font-size", "30pt").text("?").attr;
    infoHover.on("mouseover", function(d) {
    	infoHover.classed("hovering", true);
    }).on("mouseout", function(d) {
    	infoHover.classed("hovering", false);
    }).call(infoTooltip);
    
    // Create the graph and history representations
    var graph = createGraphFromSurveyData(surveyData, params);
    var history = DirectedAcyclicGraphHistory();
    
    
    // Create the chart instances
    var DAG = DirectedAcyclicGraph();
    var DAGMinimap = DirectedAcyclicGraphMinimap(DAG).width("19.5%").height("19.5%").x("80%").y("80%");
    var DAGHistory = List().width("15%").height("85%").x("0.5%").y("7.5%");
    var DAGTooltip = DirectedAcyclicGraphTooltip();
    var DAGEdgeTooltip = DirectedAcyclicGraphEdgeTooltip();
    var DAGContextMenu = DirectedAcyclicGraphContextMenu(graph, graphSVG);

    // Attach the panzoom behavior
    var refreshViewport = function() {
        var t = zoom.translate();
        var scale = zoom.scale();
        graphSVG.select(".graph").attr("transform","translate("+t[0]+","+t[1]+") scale("+scale+")");
        minimapSVG.select('.viewfinder').attr("x", -t[0]/scale).attr("y", -t[1]/scale).attr("width", attachPoint.offsetWidth/scale).attr("height", attachPoint.offsetHeight/scale);
        graphSVG.selectAll(".node text").attr("opacity", 3*scale-0.3);
    }
    var zoom = MinimapZoom().scaleExtent([0.001, 2.0]).on("zoom", refreshViewport);
    zoom.call(this, rootSVG, minimapSVG);
    
    // A function that resets the viewport by zooming all the way out
    var resetViewport = function() {
      var curbbox = graphSVG.node().getBBox();
      var bbox = { x: curbbox.x, y: curbbox.y, width: curbbox.width+50, height: curbbox.height+50};
      scale = Math.min(attachPoint.offsetWidth/bbox.width, attachPoint.offsetHeight/bbox.height);
      w = attachPoint.offsetWidth/scale;
      h = attachPoint.offsetHeight/scale;
      tx = ((w - bbox.width)/2 - bbox.x + 25)*scale;
      ty = ((h - bbox.height)/2 - bbox.y + 25)*scale;
      zoom.translate([tx, ty]).scale(scale);
      refreshViewport();
    }
    
    // Attaches a context menu to any selected graph nodess
    function attachContextMenus() {
        DAGContextMenu.call(graphSVG.node(), graphSVG.selectAll(".node"));
        DAGContextMenu.on("open", function() {
            DAGTooltip.hide();
        }).on("close", function() {
            graphSVG.selectAll(".node").classed("preview", false);
            graphSVG.selectAll(".edge").classed("preview", false);
        }).on("hidenodes", function(nodes, selectionname) {
        	var items = []
        	for (var i = 0; i < nodes.length; i++) {
        		var node = nodes[i];
	            var item = history.addSelection([node], node.system.name, node.system);
	            items.push(item);
        	}
        	
            graphSVG.classed("hovering", false);
            listSVG.datum(history).call(DAGHistory);
	            
	            // Find the point to animate the hidden nodes to
            for (var i = 0; i < items.length; i++) {
            	var item = items[i];
	            var bbox = DAGHistory.bbox().call(DAGHistory.select.call(listSVG.node(), item), item);
	            var transform = zoom.getTransform(bbox);
	            DAG.removenode(function(d) {
	                d3.select(this).classed("visible", false).transition().duration(800).attr("transform", transform).remove();
	            });
        	}
            
            dag.draw();

            // Refresh selected edges
            var selected = {};
            graphSVG.selectAll(".node.selected").data().forEach(function(d) { selected[d.id]=true; });
            graphSVG.selectAll(".edge").classed("selected", function(d) {
                return selected[d.source.id] && selected[d.target.id]; 
            });
        }).on("hovernodes", function(nodes) {
            graphSVG.selectAll(".node").classed("preview", function(d) {
                return nodes.indexOf(d)!=-1;
            })
            var previewed = {};
            graphSVG.selectAll(".node.preview").data().forEach(function(d) { previewed[d.id]=true; });
            graphSVG.selectAll(".edge").classed("preview", function(d) {
                return previewed[d.source.id] && previewed[d.target.id]; 
            });
        }).on("selectnodes", function(nodes) {
            var selected = {};
            nodes.forEach(function(d) { selected[d.id]=true; });
            graphSVG.selectAll(".node").classed("selected", function(d) {
                var selectme = selected[d.id];
                if (d3.event.ctrlKey) selectme = selectme || d3.select(this).classed("selected");
                return selectme;
            })
            graphSVG.selectAll(".edge").classed("selected", function(d) {
                var selectme = selected[d.source.id] && selected[d.target.id];
                if (d3.event.ctrlKey) selectme = selectme || d3.select(this).classed("selected");
                return selectme;
            });           
            attachContextMenus();
            DAGTooltip.hide();
        }).on("setdate", function(date) {
        	currentDate = date;
    		$("#slider").slider("value", currentDate);
        	showDate();
        });
    }
    
    // Detaches any bound context menus
    function detachContextMenus() {
        $(".graph .node").unbind("contextmenu");    
    }
    
    // A function that attaches mouse-click events to nodes to enable node selection
    function setupEvents(){
        var nodes = graphSVG.selectAll(".node");
        var edges = graphSVG.selectAll(".edge");
        var items = listSVG.selectAll(".item");
    
        // Set up node selection events
        var select = Selectable().getrange(function(a, b) {
            var path = getNodesBetween(a, b).concat(getNodesBetween(b, a));
            return nodes.data(path, DAG.nodeid());
        }).on("select", function() {
            var selected = {};
            graphSVG.selectAll(".node.selected").data().forEach(function(d) { selected[d.id]=true; });
            edges.classed("selected", function(d) {
                return selected[d.source.id] && selected[d.target.id]; 
            });
            attachContextMenus();
            DAGTooltip.hide();
        });
        select(nodes);
    
        
        nodes.on("mouseover", function(d) {
            graphSVG.classed("hovering", true);
            highlightPath(d);
        }).on("mouseout", function(d){
            graphSVG.classed("hovering", false);
            edges.classed("hovered", false).classed("immediate", false);
            nodes.classed("hovered", false).classed("immediate", false);
        });
        
        edges.on("mouseover", function(d) {
        	graphSVG.classed("hovering", true);
        	highlightEdge(d);
        }).on("mouseout", function(d) {
            graphSVG.classed("hovering", false);
            edges.classed("hovered", false).classed("immediate", false);
            nodes.classed("hovered", false).classed("immediate", false);
        })
        
        // When a list item is clicked, it will be removed from the history and added to the graph
        // So we override the DAG node transition behaviour so that the new nodes animate from the click position
        items.on("click", function(d, i) {
            // Remove the item from the history and redraw the history
            history.remove(d);
            listSVG.datum(history).call(DAGHistory);
            
            // Now update the location that the new elements of the graph will enter from
            var transform = zoom.getTransform(DAGHistory.bbox().call(this, d));
            DAG.newnodetransition(function(d) {
                if (DAG.animate()) {
                    d3.select(this).attr("transform", transform).transition().duration(800).attr("transform", DAG.nodeTranslate);
                } else {
                    d3.select(this).attr("transform", transform).attr("transform", DAG.nodeTranslate);                    
                }
            })
            
            // Redraw the graph and such
            dag.draw();
        })
        
        function highlightEdge(edge) {
        	edges.classed("hovered immediate", function(d) {
        		return d == edge;
        	});
        	nodes.classed("hovered immediate", function(d) {
        		return d == edge.source || d == edge.target;
        	});
        }
        
        function highlightPath(center) {        
            var path = getEntirePathLinks(center);
            
            var pathnodes = {};
            var pathlinks = {};
            
            path.forEach(function(p) {
               pathnodes[p.source.id] = true;
               pathnodes[p.target.id] = true;
               pathlinks[p.source.id+p.target.id] = true;
            });
            
            edges.classed("hovered", function(d) {
                return pathlinks[d.source.id+d.target.id];            
            })
            nodes.classed("hovered", function(d) {
                return pathnodes[d.id];
            });
            
            var immediatenodes = {};
            var immediatelinks = {};
            immediatenodes[center.id] = true;
            center.getVisibleParents().forEach(function(p) {
                immediatenodes[p.id] = true;
                immediatelinks[p.id+center.id] = true;
            })
            center.getVisibleChildren().forEach(function(p) {
                immediatenodes[p.id] = true;
                immediatelinks[center.id+p.id] = true;
            })
            
            edges.classed("immediate", function(d) {
                return immediatelinks[d.source.id+d.target.id];
            })
            nodes.classed("immediate", function(d) {
                return immediatenodes[d.id];
            })
        }
    }
    
    // Gets the millis date of the system
    var systemDate = function(system) {
    	return new Date(system.year, system.month, 0,0,0,0,0).getTime();
    }
    
    // Find the date range of the survey data
    var minDate = Infinity;
    var maxDate = 0;
    console.log(surveyData);
    for (var systemName in surveyData.systems) {
    	var system = surveyData.systems[systemName];
    	var date = systemDate(system);
    	if (date < minDate) {
    		minDate = date;
    	}
    	if (date > maxDate) {
    		maxDate = date;
    	}
    }
    
    // Save the current date selection
    var currentDate = maxDate;
    
    // Step size of 1 month
    var step = new Date(2000,2,0,0,0,0,0).getTime() - new Date(2000,1,0,0,0,0,0).getTime();
    var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ];
    
    // Set up slider div
    var sliderDiv = d3.select(attachPoint).append("div").attr("class", "timeline");
    var sliderLabel = sliderDiv.append("div").attr("id", "sliderlabel");
    sliderDiv.append("div").attr("id", "slider");
    sliderLabel.append("div").attr("id", "sliderlabel-month").attr("class", "sliderlabel-month");
    sliderLabel.append("div").attr("id", "sliderlabel-year").attr("class", "sliderlabel-year");
    sliderLabel.append("div").attr("class", "clearall");
    var sliderButtons = sliderDiv.append("div").attr("class", "buttons");
    
    // Sets the slider to the specified date
    var setDate = function(dateMillis) {
        $("#sliderlabel-month").text(monthNames[new Date(dateMillis).getMonth()]);
        $("#sliderlabel-year").text(new Date(dateMillis).getFullYear());
        currentDate = dateMillis;
    }
    
    var nextAnimation = null;
    
    // Shows / hides nodes for the current date selection
    var showDate = function() {
        graphSVG.selectAll(".node").attr("display", function(d) {
            d.animation_hiding = systemDate(d.system) > currentDate ? true : null;
            return d.animation_hiding ? "none" : "";
        });
        graphSVG.selectAll(".edge").attr("display", function(d) {
            return (d.source.animation_hiding || d.target.animation_hiding) ? "none" : ""; 
        })
        if (currentDate < maxDate && nextAnimation == null) {
			$(".play-timeline").attr("disabled", false);
        }
    }

    // Attach the slider
    $(function() {
      $( "#slider" ).slider({
        value: maxDate,
        min: minDate,
        max: maxDate,
        step: step,
        slide: function( event, ui ) {
        	setDate(ui.value);
        	showDate();
        }
      });
  	  setDate(maxDate);
    });
    
    // If currently animating, pause
    var pauseAnimation = function() {
    	if (nextAnimation != null) {
    		clearTimeout(nextAnimation);
    		nextAnimation = null;
    		
    		if (currentDate < maxDate) {
    			$(".play-timeline").attr("disabled", false);
    		}
    		$(".pause-timeline").attr("disabled", true);
    	}
    }
    
    // Play animation from current date
    var playAnimation = function() {
    	// If another animation in progress, remove it
    	pauseAnimation();
    	
    	// Now check to see whether we can animate
    	if (currentDate < maxDate) {
    		// Can animate, so do so
    		currentDate += step;

    		$("#slider").slider("value", currentDate);
    		setDate(currentDate);
    		showDate();

    		$(".play-timeline").attr("disabled", true);
    		$(".pause-timeline").attr("disabled", false);
    		
    		nextAnimation = window.setTimeout(playAnimation, 100);
    	}
    }
    
    // Start from scratch.
    var restartAnimation = function() {
    	currentDate = minDate;
    	playAnimation();
    }
    
    // Attach buttons
    sliderButtons.append("button").attr("class", "restart-timeline").text("Restart").on("click", restartAnimation);
    sliderButtons.append("button").attr("class", "play-timeline").text("Resume").on("click", playAnimation).attr("disabled", true);
    sliderButtons.append("button").attr("class", "pause-timeline").text("Pause").on("click", pauseAnimation).attr("disabled", true);
    
    // The main draw function
    this.draw = function() {
        DAGTooltip.hide();                  // Hide any tooltips
        console.log("draw begin")
        var begin = (new Date()).getTime();  
        var start = (new Date()).getTime();        
        graphSVG.datum(graph).call(DAG);    // Draw a DAG at the graph attach
        console.log("draw graph", new Date().getTime() - start);
        showDate();
        start = (new Date()).getTime();    
        minimapSVG.datum(graphSVG.node()).call(DAGMinimap);  // Draw a Minimap at the minimap attach
        console.log("draw minimap", new Date().getTime() - start);
        start = (new Date()).getTime();
        graphSVG.selectAll(".node").call(DAGTooltip);        // Attach tooltips
        graphSVG.selectAll(".edge").call(DAGEdgeTooltip);        // Attach tooltips
        console.log("draw tooltips", new Date().getTime() - start);
        start = (new Date()).getTime();
        setupEvents();                      // Set up the node selection events
        console.log("draw events", new Date().getTime() - start);
        start = (new Date()).getTime();
        refreshViewport();                  // Update the viewport settings
        console.log("draw viewport", new Date().getTime() - start);
        start = (new Date()).getTime();
        attachContextMenus();
        console.log("draw contextmenus", new Date().getTime() - start);
        console.log("draw complete, total time=", new Date().getTime() - begin);
    }
    
    //Call the draw function
    this.draw();
    
    // Start with the graph all the way zoomed out
    resetViewport();

    // Save important variables
    this.attachPoint = attachPoint;
    this.surveyData = surveyData;
    this.DAG = DAG
    this.DAGMinimap = DAGMinimap;
    this.DAGHistory = DAGHistory;
    this.DAGTooltip = DAGTooltip;
    this.DAGContextMenu = DAGContextMenu;
    this.graph = graph;
    this.resetViewport = resetViewport;
    this.history = history;
}