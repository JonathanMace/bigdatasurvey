var DirectedAcyclicGraphContextMenu = function(graph, graphSVG) {
    
    var onMenuOpen = function(d) {
        handlers.open.call(this, d);
    }
    
    var onMenuClose = function(d) {
        handlers.close.call(this, d);
    }
    
    var onMenuClick = function(d) {
        if (d.operation=="hideselected") {
            var items = graphSVG.selectAll(".node.selected").data();
            var name = "";
            if (items.length == 1) {
            	name = items[0].system.name;
            } else {
            	name = "(" + items.length + " systems)";
            }
            handlers.hidenodes.call(this, items, name);
        }
        if (d.operation=="hideunselected") {
            var items = graphSVG.selectAll(".node").filter(function(d) {
                return !d3.select(this).classed("selected");
            }).data();
            var name = "";
            if (items.length == 1) {
            	name = items[0].system.name;
            } else {
            	name = "(" + items.length + " systems)";
            }
            handlers.hidenodes.call(this, items, name);
        }
        if (d.operation=="hidethis") {
            var items = d3.select(this).data();
            var name = items[0].system.name;
            handlers.hidenodes.call(this, items, name);
        }
        if (d.operation=="hidefield") {
            var fieldname = d.fieldname;
            var value = d.value;
            var items = graph.getNodes().filter(function(node) {
                return !node.never_visible && node.report && 
                node.report[fieldname] && node.report[fieldname][0]==value;
            });
            var name = fieldname+": "+value;
            handlers.hidenodes.call(this, items, name);
        }
        if (d.operation=="invertselection") {
            var items = graphSVG.selectAll(".node").filter(function(d) {
                return !d3.select(this).classed("selected");
            }).data();
            handlers.selectnodes.call(this, items);
        }
        if (d.operation=="selectall") {
            var items = graph.getVisibleNodes();
            handlers.selectnodes.call(this, items);
        }
        if (d.operation=="selectneighbours") {
            var item = d3.select(this).data()[0];
            var items = item.getVisibleParents().concat(item.getVisibleChildren());
            items.push(item);
            handlers.selectnodes.call(this, items);
        }
        if (d.operation=="selectpath") {
            var items = getEntirePathNodes(d3.select(this).data()[0]);
            handlers.selectnodes.call(this, items, name);
        }
        if (d.operation=="selectfield") {
            var fieldname = d.fieldname;
            var value = d.value;
            var items = graph.getVisibleNodes().filter(function(node) {
                return node.report && node.report[fieldname] && node.report[fieldname][0]==value;
            });
            handlers.selectnodes.call(this, items);
        }
        if (d.operation=="selectearlier") {
        	var system = d3.select(this).data()[0].system;
        	console.log(system);
        	var date = new Date(system.year, system.month, 0,0,0,0,0);
        	var items = graph.getVisibleNodes().filter(function(node) {
        		return node.system && (node.system.year < system.year || (node.system.year == system.year && node.system.month <= system.month));
        	});
        	handlers.selectnodes.call(this, items);
        }
        if (d.operation=="selectlater") {
        	var system = d3.select(this).data()[0].system;
        	var items = graph.getVisibleNodes().filter(function(node) {
        		return node.system && (node.system.year > system.year || (node.system.year == system.year && node.system.month >= system.month));
        	});
        	handlers.selectnodes.call(this, items);
        }
        if (d.operation=="setdate") {
        	var system = d3.select(this).data()[0].system;
        	var date = new Date(system.year, system.month, 0,0,0,0,0).getTime();
        	handlers.setdate.call(this, date);
        }
    }
    
    var onOptionMouseOver = function(d) {
        var items = [];
        if (d.operation=="hideselected") {
            items = graphSVG.selectAll(".node.selected").data();
        }
        if (d.operation=="hideunselected") {
            var items = graphSVG.selectAll(".node").filter(function(d) {
                return !d3.select(this).classed("selected");
            }).data();
        }
        if (d.operation=="hidethis") {
            items = d3.select(this).data();
        }
        if (d.operation=="hidefield" || d.operation=="selectfield") {
            var fieldname = d.fieldname;
            var value = d.value;
            items = graph.getVisibleNodes().filter(function(node) {
                return node.report && node.report[fieldname] && node.report[fieldname][0]==value;
            });            
        }
        if (d.operation=="invertselection") {
            var items = graphSVG.selectAll(".node").filter(function(d) {
                return !d3.select(this).classed("selected");
            }).data();
        }
        if (d.operation=="selectall") {
            items = graph.getVisibleNodes();
        }
        if (d.operation=="selectneighbours") {
            var item = d3.select(this).data()[0];
            items = item.getVisibleParents().concat(item.getVisibleChildren());
            items.push(item);
        }
        if (d.operation=="selectpath") {
            items = getEntirePathNodes(d3.select(this).data()[0]);
        }
        handlers.hovernodes.call(this, items);
    }
    
    var onOptionMouseOut = function(d) {
        handlers.hovernodes.call(this, []);
    }
    
    var ctxmenu = ContextMenu().on("open", onMenuOpen)
                               .on("close", onMenuClose)
                               .on("click", onMenuClick)
                               .on("mouseover", onOptionMouseOver)
                               .on("mouseout", onOptionMouseOut);
    
    var menu = function(selection) {
        menu.hide.call(this, selection);
        selection.each(function(d) {
            
            var items = [];
            
            items.push({
               "operation": "setdate",
               "name": "Set timeline to this system"
            });

            items.push({
                "operation": "hidethis",
                "name": "Hide this system",
            });
            
            if (!selection.filter(".selected").empty()) {   
                items.push({
                    "operation": "hideselected",
                    "name": "Hide selected systems",
                });
                items.push({
                    "operation": "hideunselected",
                    "name": "Hide non-selected systems"
                })
            }
            
            var addHideField = function(fieldname) {
                if (d.report && d.report[fieldname] && d.report[fieldname][0]) {
                    items.push({
                        "operation": "hidefield",
                        "name": "Hide all <span class='highlight'>"+d.report[fieldname][0]+"</span> nodes",
                        "fieldname": fieldname,
                        "value": d.report[fieldname][0],
                    });
                }
            }
            
            var addSelectField = function(fieldname) {
                if (d.report && d.report[fieldname] && d.report[fieldname][0]) {
                    items.push({
                        "operation": "selectfield",
                        "name": "Select all <span class='highlight'>"+d.report[fieldname][0]+"</span> nodes",
                        "fieldname": fieldname,
                        "value": d.report[fieldname][0],
                    });
                }
            }

            addHideField("Agent");
            addHideField("Host");
            addHideField("Class");
            addHideField("ProcessID");
            addHideField("StateMachineID");
            
            if (!selection.filter(".selected").empty()) {   
                items.push({
                    "operation": "invertselection",
                    "name": "Invert selection",
                });
            }
            
            items.push({
                "operation": "selectall",
                "name": "Select all"                
            });
            
            items.push({
               "operation": "selectneighbours",
               "name": "Select direct dependencies"
            });
            
            items.push({
               "operation": "selectpath",
               "name": "Select all dependencies"
            });
            
            items.push({
               "operation": "selectearlier",
               "name": "Select older systems"
            });
            
            items.push({
               "operation": "selectlater",
               "name": "Select newer systems"
            });
            
            addSelectField("Agent");
            addSelectField("Host");
            addSelectField("Class");
            addSelectField("ProcessID");
            addSelectField("StateMachineID");
            
            ctxmenu.call(this, items);         
            
            d3.select(this).classed("hascontextmenu", true);
        });
    }

    menu.hide = function(selection) {
        d3.select(this).selectAll(".hascontextmenu").each(function(d) {
            $(this).unbind("contextmenu");
        })
        d3.select(this).selectAll(".context-menu").remove();
    }
    
    var onhide = function(nodes, selectionname) {}
    
    var handlers = {
        "hidenodes": function() {},
        "selectnodes": function() {},
        "hovernodes": function() {},
        "open": function() {},
        "close": function() {},
        "setdate": function() {}
    }
    
    menu.on = function(event, _) {
        if (!handlers.hasOwnProperty(event)) return menu;
        if (arguments.length==1) return handlers[event];
        handlers[event] = _;
        return menu;
    }
    
    return menu;
}


var ContextMenu = function() {
    
    var idseed = 0;
    
    var menu = function(ds) {
        var attach = this;
        
        // Create the menu items
        var menu = {};
        for (var i = 0; i < ds.length; i++) {
            var item = ds[i];
            var itemname = name.call(this, item);
            menu[itemname] = { 
                "click": menuClick(attach, item, i),
                "mouseover": menuMouseOver(attach, item, i),
                "mouseout": menuMouseOut(attach, item, i)
            };
        }
        
        // Set the options
        var options = {
            "disable_native_context_menu": true,
            "showMenu": function() { handlers.open.call(attach, ds); },
            "hideMenu": function() { handlers.close.call(attach, ds); }
        }
        
        // Attach the context menu to this element
        $(attach).contextMenu('context-menu'+(idseed++), menu, options);
    }
    
    // Stupid javascript
    var menuClick = function(attach,d, i) {
        return function() {
            handlers.click.call(attach, d, i);
        }
    }
    
    // Stupid stupid javascript
    var menuMouseOver = function(attach, d, i) {
        return function() {
            handlers.mouseover.call(attach, d, i);
        }
    }
    
    // Stupid stupid stupid javascript
    var menuMouseOut = function(attach, d, i) {
        return function() {
            handlers.mouseout.call(attach, d, i);
        }
    }
    
    var name = function(d) { return d.name; }
    
    var handlers = {
        "click": function() {},
        "open": function() {},
        "close": function() {},
        "mouseover": function() {},
        "mouseout": function() {},
    }
    
    
    menu.name = function(_) { if (arguments.length==0) return name; name = _; return menu; }
    menu.on = function(event, _) {
        if (!handlers[event]) return menu;
        if (arguments.length==1) return handlers[event];
        handlers[event] = _;
        return menu;
    }
    
    
    return menu;
}