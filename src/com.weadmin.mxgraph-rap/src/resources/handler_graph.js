

(function() {
	'use strict';


	rap.registerTypeHandler("eclipsesource.graph", {

		factory : function(properties) {
			return new eclipsesource.graph(properties);
		},

		destructor : "destroy",
		methods : [ 'insertVertex', 'insertEdge','appendXmlModel','removeCells',
		            'putCellStyle','setCellStyle','translateCell','setCellChildOffset','setCellOffset',
		            'zoomIn','zoomOut','setTooltip','selectCell','selectCells','addCellOverlay','removeCellOverlays','graghLayout'],
		properties : [ "size", "xmlModel","prop","arrowOffset","textAutoRotation"],
		events:['modelUpdate']

	});

	if (!window.eclipsesource) {
		window.eclipsesource = {};
	}

	eclipsesource.graph = function(properties) {
		console.log("graph....." + properties)
		bindAll(this, [ "layout", "onReady", "onSend", "onRender" ,"onConnect","mouseHover","autoSave","onRemove",
		                "onCellConnect","getTooltipForCell"]);
		this.parent = rap.getObject(properties.parent);
		this.element = document.createElement("div");
		this.parent.append(this.element);
		this.parent.addListener("Resize", this.layout);

		this._size = properties.size ? properties.size : {
			width : 300,
			height : 300
		};
		
		this.element.style.overflowY = 'auto';
		this.element.style.overflowX = 'auto';
		
		this.mxCreateLabel = mxCellRenderer.prototype.createLabel;
		
		
		var mxGraphViewGetPerimeterPoint = mxGraphView.prototype.getPerimeterPoint;
		mxGraphView.prototype.getPerimeterPoint = function(terminal, next, orthogonal, border)
		{
			var point = mxGraphViewGetPerimeterPoint.apply(this, arguments);
			
			if (point != null)
			{
				var perimeter = this.getPerimeterFunction(terminal);

				if (terminal.text != null && terminal.text.boundingBox != null)
				{
					// Adds a small border to the label bounds
					var b = terminal.text.boundingBox.clone();
					b.grow(3)

					if (mxUtils.rectangleIntersectsSegment(b, point, next))
					{
						point = perimeter(b, terminal, next, orthogonal);
					}
				}
			}
				
			return point;
		},
		
		mxConnector.arrowOffset = 1.0;
		
		mxConnector.prototype.paintEdgeShape = function(c, pts)
		{
			var offset = mxConnector.arrowOffset;
			// The indirection via functions for markers is needed in
			// order to apply the offsets before painting the line and
			// paint the markers after painting the line.
			var ptss = [];
			var ptst = [];
			for(var i in pts){
				ptss.push(pts[i].clone());
			}
			for(var i in pts){
				ptst.push(pts[i].clone());
			}

			if (offset < 1){
				ptss[0].x = pts[1].x+(pts[0].x-pts[1].x)*offset;//(pts[0].x+pts[1].x)/2;
				ptss[0].y = pts[1].y+offset*(pts[0].y-pts[1].y);//(pts[0].y+pts[1].y)/2;
				ptst[pts.length-1].x = pts[pts.length-2].x+offset*(pts[pts.length-1].x-pts[pts.length-2].x);//(pts[0].x+pts[1].x)/2;
				ptst[pts.length-1].y = pts[pts.length-2].y+offset*(pts[pts.length-1].y-pts[pts.length-2].y);//(pts[0].y+pts[1].y)/2;
			}
			
			
			var sourceMarker = this.createMarker(c, ptss, true);
			var targetMarker = this.createMarker(c, ptst, false);

			mxPolyline.prototype.paintEdgeShape.apply(this, arguments);	
			
			// Disables shadows, dashed styles and fixes fill color for markers
			c.setFillColor(this.stroke);
			c.setShadow(false);
			c.setDashed(false);
			
			if (sourceMarker != null)
			{
				sourceMarker();
			}
			
			if (targetMarker != null)
			{
				targetMarker();
			}
		},
		

		
		// Disables the built-in context menu
		mxEvent.disableContextMenu(this.element);
		HoverIcons.prototype.checkCollisions = false;
		mxTooltipHandler.prototype.zIndex = 1000500000;
		
		this._graph = new Graph(this.element);
		this._parent = null;
		this._xmlModel = null;
		this._hoverCell = null;
		this._tooltips = {};
		this._textAutoRotation = false;
		
		new HoverIcons(this._graph);

		this._graph.setAllowDanglingEdges(false);
		this._graph.setDisconnectOnMove(false);
		this._graph.ignoreScrollbars = true;
		this._graph.allowNegativeCoordinates = false;

		//this._graph.setConnectable(true);
		
		this._graph.setTooltips(true);
		
		this._graph.getTooltipForCell = this.getTooltipForCell;
		
		mxStencilRegistry.loadStencilSet(MXGRAPH_BASEPATH+"stencils/cisco/routers.xml");

		rap.on("render", this.onRender);
	};

	eclipsesource.graph.prototype = {

		ready : false,

		onReady : function() {
			// TODO [tb] : on IE 7/8 the iframe and body has to be made
			// transparent explicitly
			this.ready = true;
			this.layout();
			
			console.log("graph...onReady..");

		},

		onRender : function() {
			if (this.element.parentNode) {
				rap.off("render", this.onRender);

				var graph = this._graph;
				graph.addMouseListener(this);
				// Gets the default parent for inserting new cells. This
				// is normally the first child of the root (ie. layer 0).

				// // Adds cells to the model in a single step
				graph.getModel().beginUpdate();
				try {
					if (this._xmlModel && this._xmlModel != null) {
						var xmlDocument = mxUtils.parseXml(this._xmlModel);
						var node = xmlDocument.documentElement;
						var decoder = new mxCodec(xmlDocument);
						decoder.decode(node, graph.getModel());
					}
				} finally {
					// Updates the display
					graph.getModel().endUpdate();
				}
				
				var parent = graph.getDefaultParent();
				this._parent = parent;

				graph.connectionHandler.addListener(mxEvent.CONNECT, this.onConnect);
				var mgr = new mxAutoSaveManager(graph);
				mgr.save = this.autoSave;
				
				graph.addListener(mxEvent.CELLS_REMOVED,this.onRemove);
				graph.addListener(mxEvent.CELLS_RESIZED,this.onRemove);
				graph.addListener(mxEvent.CELLS_MOVED,this.onRemove);
				graph.addListener(mxEvent.CELL_CONNECTED,this.onCellConnect);
				//graph.addListener(mxEvent.DISCONNECT,this.onCellConnect);
				
				rap.on("send", this.onSend);

				this.ready = true;
				this.layout();
			}
		},
		
		getTooltipForCell:function(cell){
			if (cell){
				return this._tooltips[cell.getId()];
			}else{
				return '';
			}
			
		},

		onSend : function() {
			// if( this.editor.checkDirty() ) {
			// rap.getRemoteObject( this ).set( "text", this.editor.getData() );
			// this.editor.resetDirty();
			// }
			var enc = new mxCodec(mxUtils.createXmlDocument());
			var node = enc.encode(this._graph.getModel());
			var xml = mxUtils.getXml(node);
			rap.getRemoteObject( this ).set( "model", xml);
			console.log("graph...onSend..")
		},

		mouseDown : function(sender, me) {
			//console.log(me);
			var ro = rap.getRemoteObject(this)
			if (me.sourceState == undefined) {
				if (me.evt.button == 0) {
					// var v1 = this._graph.insertVertex(this._parent, null,
					// 'node', me.graphX, me.graphY, 80, 30);
				}

				ro.call('onMouseDown', {
					x : me.graphX,
					y : me.graphY,
					button : me.evt.button
				});
			} else {

				
			}

		},
		
		mouseMove : function(sender, me) {},
		mouseUp : function(sender, me) {
			var ro = rap.getRemoteObject(this)
			if (me.sourceState != undefined) {
				if (me.sourceState.cell.edge) {
					ro.call('onEdgeSelect', {
						x : me.graphX,
						y : me.graphY,
						button : me.evt.button,
						id : me.sourceState.cell.id
					});
				} else {
					ro.call('onNodeSelect', {
						x : me.graphX,
						y : me.graphY,
						button : me.evt.button,
						id : me.sourceState.cell.id
					});
				}
			}
		},
		dragEnter : function(evt, state) {},
		dragLeave : function(evt, state) {},

		setXmlModel : function(content) {
			this._xmlModel = content;
			if (this.ready) {
				async(this, function() { // Needed by IE for some reason
					if (this._xmlModel && this._xmlModel != null) {
						var xmlDocument = mxUtils.parseXml(this._xmlModel);
						var node = xmlDocument.documentElement;
						var decoder = new mxCodec(xmlDocument);
						decoder.decode(node, this._graph.getModel());
						var parent = this._graph.getDefaultParent();
						this._parent = parent;
					}
				});
			}
			var ro = rap.getRemoteObject(this)
			ro.call('isCompleted', {
				isCompleted : true
			});
			console.log('xml loaded');
		},
		
		appendXmlModel : function(model) {
			
			var graph = this._graph;
			
			var doc = mxUtils.parseXml(model.content);
			var codec = new mxCodec(doc);
			codec.lookup = function(id){
				//console.log(graph.getModel().cells)
				//console.log(id)
				return graph.getModel().getCell(id);
			}
			
			var n = codec.decode(doc.documentElement);
			n.parent = null;
			//console.log(n);
			//graph.getModel().beginUpdate();
			
			var cells = [];
			try {
				cells.push(n);
				graph.addCells(cells);
			} finally {
				// Updates the display
				//graph.getModel().endUpdate();
			}
		},
		
		//auto composing
		graghLayout:function(obj){
			console.log(obj);
			var type = obj.type;
			var graph = this._graph;
			var parent = graph.getDefaultParent();
			graph.getModel().beginUpdate();
			try{
				var layouts = new mxStackLayout(graph);
				layouts.execute(parent);
				if(type == 'circle'){
					var layout = new mxCircleLayout(graph);//circle
				}else if(type == 'tree'){
					var layout = new mxCompactTreeLayout(graph);//tree
				}else if(type == 'stack'){
					var fast = new mxFastOrganicLayout(graph);
					fast.execute(parent);
					var layout = new mxStackLayout(graph);//stack
				}else if(type == 'partition'){
					var layout = new mxPartitionLayout(graph);//partition
				}else if(type == 'hierarchical'){
					var layout = new mxHierarchicalLayout(graph);//hierarchical
				}else if(type == 'fast'){
					var layout = new mxFastOrganicLayout(graph);//fastorganic
				}
				layout.execute(parent);
			} finally {
				var morph = new mxMorphing(graph);
				morph.addListener(mxEvent.DONE, function()
				{
					graph.getModel().endUpdate();
				});
				morph.startAnimation();
			}
		},

		setProp:function(data){
			var name = data.name;
			var val = data.value;
			var fn = "set"+name.substr(0,1).toUpperCase()+name.substr(1,name.length-1);
			var f = this._graph[fn];
			//console.log(fn);
			if (f){
				//console.log(f);
				var graph = this._graph;
				f.call(graph,val);
			}
			
			
		},
		
		putCellStyle : function(data){
			var name = data.name;
			var stylejson = data.style;
			var style = new Object();
			for(var k in stylejson){
				if (k == mxConstants.STYLE_PERIMETER){
					if (stylejson[k]=='mxPerimeter.EllipsePerimeter'){
						style[k] = mxPerimeter.EllipsePerimeter;
					}else if (stylejson[k]=='mxPerimeter.RectanglePerimeter'){
						style[k] = mxPerimeter.RectanglePerimeter;
					}else if (stylejson[k]=='mxPerimeter.RhombusPerimeter'){
						style[k] = mxPerimeter.RhombusPerimeter;
					}else if (stylejson[k]=='mxPerimeter.TrianglePerimeter'){
						style[k] = mxPerimeter.TrianglePerimeter;
					}else if (stylejson[k]=='mxPerimeter.HexagonPerimeter'){
						style[k] = mxPerimeter.HexagonPerimeter;
					}
				}else if (k == mxConstants.STYLE_IMAGE){
					style[k] = MXGRAPH_BASEPATH + stylejson[k];
				}else{
					style[k] = stylejson[k];
				}
			}
			
			this._graph.getStylesheet().putCellStyle(name, style);
		},
		
		setCellStyle : function(data){
			var cell = this._graph.getModel().getCell(data.id);
			
			if (cell){
				var cells = [];
				cells.push(cell);
				
				this._graph.setCellStyle(data.style,cells);
			}
			
		},
		
		setCellChildStyle:function(data){
			var cell = this._graph.getModel().getCell(data.id);
			if (cell){
				var child = cell.getChildAt(data.index);
				if (child){
					var cells = [];
					cells.push(child);
					this._graph.setCellStyle(data.style,cells);
				}
			}
		},
		translateCell : function(data){
			var cell = this._graph.getModel().getCell(data.id);
			if (cell) {
				this._graph.translateCell(cell,data.dx,data.dy);
			}
		},
		setCellOffset : function(data){
			var cell = this._graph.getModel().getCell(data.id);
			if (cell){
				var geometry = this._graph.getModel().getGeometry(cell);
				var geom = geometry.clone();
				if (geom.relative){
					geom.offset = new mxPoint(data.offsetX,data.offsetY);
					this._graph.getModel().setGeometry(cell, geom);
				}
			}
		},
		
		setCellChildOffset:function(data){
			var cell = this._graph.getModel().getCell(data.id);
			if (cell){
				var child = cell.getChildAt(data.index);
				
				if (child){
					var geometry = this._graph.getModel().getGeometry(child);
					var geom = geometry.clone();
					if (geom.relative){
						geom.offset = new mxPoint(data.offsetX,data.offsetY);
						this._graph.getModel().setGeometry(child, geom);
					}
					
				}
			}
		},
		
		insertVertex : function(vertex) {
			if (this.ready) {
				async(this, function() {
					if (vertex.shape) {
						this._graph.insertVertex(this._parent, vertex.id,
								vertex.value, vertex.x, vertex.y, vertex.width,
								vertex.height, vertex.shape);
					} else {
						this._graph.insertVertex(this._parent, vertex.id,
								vertex.value, vertex.x, vertex.y, vertex.width,
								vertex.height);
					}
				});
			}
		},
		
		insertEdge: function(edge) {
			if (this.ready) {
				async(this, function(){
					var src = this._graph.getModel().getCell(edge.source);
					var tgt = this._graph.getModel().getCell(edge.target);
					
					this._graph.insertEdge(this._parent, edge.id, edge.value, src, tgt);
				});
			}
		},
		
		removeCells : function(){
			if (this.ready) {
				if (this._graph.isEnabled()){
					this._graph.removeCells();
				}
				
			}
		},
		onRemove:function(sender,evt){
			//console.log(evt)
			var ro = rap.getRemoteObject(this);
			var cells = evt.getProperty('cells');
			var ids = [];
			for(var i in cells){
				var cell = cells[i];
				ids.push({id:cell.id,edge:cell.edge});
				
				//text auto ratation
				if (this._textAutoRotation){
					var edges = cell.edges;
					for(var j in edges){
						var e = edges[j];
						if (e.children && e.children.length>0){
							var text = e.children[0];
							var sx = e.source.getGeometry().getCenterX();
							var sy = e.source.getGeometry().getCenterY();
							var dx = e.target.getGeometry().getCenterX();
							var dy = e.target.getGeometry().getCenterY();
							var angle = Math.atan((dy-sy)/(dx-sx))*360/(2*Math.PI);
							if (dx<sx&&dy>sy){
								angle = 180+angle;
							}else if (dx<sx&&dy<sy){
								angle = 180+angle;
							}else if (dx>sx&&dy<sy){
								angle = 360+angle;
							}
							var style = text.getStyle();
							var newstyle = "";
							
							var pos = style.indexOf("rotation=");
							if (pos>0){
								var t1 = style.substring(0,pos)
								var t2 = style.substring(pos,style.length)
								var pos2 = t2.indexOf(";");
								if (pos2<0){
									newstyle = t1+"rotation="+angle+";";
								}else{
									var t3=t2.substring(pos2,t2.length);
									newstyle = t1+"rotation="+angle+t3;	
								}
							}else{
								if (style.charAt(style.length-1) != ";"){
									style = style +";"
								}
								newstyle = style+"rotation="+angle +";"
							}
							
							var texts = [];
							texts.push(text);
							this._graph.setCellStyle(newstyle,texts);
							console.log(newstyle);
							
							var data = {id:text.id};
							data.offsetX=15*Math.sin(angle*0.017453293)
							data.offsetY=-15*Math.cos(angle*0.017453293)
							this.setCellOffset(data)
						}
					}
				}
			}
			
			ro.call(evt.name, {
				ids :ids
			});
		},
		
		onCellConnect:function(sender,evt){
			//console.log(evt)
			var ro = rap.getRemoteObject(this);
			var edge = evt.properties.edge;
			var term = evt.properties.terminal;
			var je = {};
			je.id = edge.id;
			if (edge.source)
				je.source = edge.source.id;
			if (edge.target)
				je.target = edge.target.id;
			//this.autoSave();
			if (evt.properties.previous){	
				ro.call(evt.name, {edge:je,source:evt.properties.source,
				terminal:term.id,previous:evt.properties.previous.id});
			}else{
				ro.call(evt.name, {edge:je,source:evt.properties.source,terminal:term.id});
			}
			
		},
		
		onConnect:function(sender, evt) {
			
			var graph = this._graph;
			var edge = evt.getProperty('cell');
			var source = graph.getModel().getTerminal(edge, true);
			var target = graph.getModel().getTerminal(edge, false);

			var style = graph.getCellStyle(edge);
			//var sourcePortId = style[mxConstants.STYLE_SOURCE_PORT];
			//var targetPortId = style[mxConstants.STYLE_TARGET_PORT];

			var enc = new mxCodec(mxUtils.createXmlDocument());
			var node = enc.encode(edge);
			var xml = mxUtils.getXml(node);
			
			//var ro = rap.getRemoteObject(this)
			ro.call('modelUpdate',{'cells':xml});
			//this.autoSave();
			ro.call('onConnect', {source:source.id,target:target.id});

		},
		
		mouseHover: function(me){
			var cell = me.getCell();
			if (cell != null){
				//console.log("mouseHover:"+cell)
				this._hoverCell = cell;
				var ro = rap.getRemoteObject(this);
				ro.call('onMouseHover',{id:cell.id,edge:cell.edge,x : me.graphX,y : me.graphY,button : me.evt.button});
			}
			if (cell == null && this._hoverCell != null){
				var ro = rap.getRemoteObject(this);
				var cell = this._hoverCell;
				 this._hoverCell = null;
				ro.call('onMouseLeave',{id:cell.id,edge:cell.edge,x : me.graphX,y : me.graphY,button : me.evt.button});
			}
		
			return cell;
		},
		
		autoSave : function(){
			console.log("autoSave");
			var enc = new mxCodec(mxUtils.createXmlDocument());
			var node = enc.encode(this._graph.getModel());
			var xml = mxUtils.getXml(node);
			rap.getRemoteObject( this ).set( "model", xml);
		},
		
		zoomIn :function(obj){
			if (this.ready) {
				async(this, function(){
					this._graph.zoomIn();
				});
			}
		},
		
		zoomOut :function(obj){
			if (this.ready) {
				async(this, function(){
					this._graph.zoomOut();
				});
			}
		},
		
		setTooltip : function(obj){
			if (obj)
				this._tooltips[obj.id] = obj.tooltip;
		},
		
		selectCell : function(obj){
			var cell = this._graph.getModel().getCell(obj.id);
			if (cell){
				this._graph.setSelectionCell(cell);
			}
		},
		
		selectCells : function(obj){
			var cells = [];
			for(var i in obj.ids){
				var id = obj.ids[i];
				var cell = this._graph.getModel().getCell(id);
				if (cell)
					cells.push(cell);
			}
			
			this._graph.setSelectionCells(cells);
			
		},
		
		setArrowOffset : function(v){
			mxConnector.arrowOffset = v;
		},
		
		setTextAutoRotation : function(v){
			this._textAutoRotation = v;
			if (v){
				mxPolyline.prototype.getRotation = function()
				{
					var sx = this.points[0].x;
					var sy = this.points[0].y;
					var dx = this.points[1].x;
					var dy = this.points[1].y;
					var angle = Math.atan((dy-sy)/(dx-sx))*360/(2*Math.PI);
					if (dx<sx&&dy>sy){
						angle = 180+angle;
					}else if (dx<sx&&dy<sy){
						angle = 180+angle;
					}else if (dx>sx&&dy<sy){
						angle = 360+angle;
					}
					
					return angle;
				};
				var CreateLabel = this.mxCreateLabel;
				mxCellRenderer.prototype.createLabel = function(state, value){
					if (state.cell.edge==1){
						state.style['verticalAlign']='bottom';
					}
					return CreateLabel.apply(this, arguments);
				}
			}else{
				mxPolyline.prototype.getRotation = function()
				{
					return 0;
				};
				mxCellRenderer.prototype.createLabel = this.mxCreateLabel;
			}
			
		},
		
		addCellOverlay : function(obj){
			var cell = this._graph.getModel().getCell(obj.id);
			if (cell){
				this._graph.removeCellOverlays(cell);
				var overlay = new mxCellOverlay(
						new mxImage(obj.image, obj.width, obj.height),
						obj.tooltip);
				this._graph.addCellOverlay(cell, overlay);
			}
		},
		removeCellOverlays : function(obj){
			var cell = this._graph.getModel().getCell(obj.id);
			if (cell){
				this._graph.removeCellOverlays(cell);
			}
		},
		setSize : function(size) {
			if (this.ready) {
				async(this, function() { // Needed by IE for some reason
				});
			} else {
				this._size = size;
			}
		},

		destroy : function() {
			rap.off("send", this.onSend);
			this.element.parentNode.removeChild(this.element);
		},

		layout : function() {
			var div = this.element;
			var sizee = this._size;
			console.log(div.scrollHeight)
			console.log(div.scrollWidth)
			console.log(sizee)
			while(true){
				if(div.scrollHeight<=sizee.height&&div.scrollWidth<=sizee.width){
					break;
				}
				this._graph.zoomOut();
			}
			console.log("graph...layout..")
			if (this.ready) {
				var area = this.parent.getClientArea();
				this.element.style.left = area[0] + "px";
				this.element.style.top = area[1] + "px";
				this.element.style.width = area[2] + "px";
				this.element.style.height = area[3] + "px";
			}
		}

	};

	var bind = function(context, method) {
		return function() {
			return method.apply(context, arguments);
		};
	};

	var bindAll = function(context, methodNames) {
		for (var i = 0; i < methodNames.length; i++) {
			var method = context[methodNames[i]];
			context[methodNames[i]] = bind(context, method);
		}
	};
	var async = function(context, func) {
		window.setTimeout(function() {
			func.apply(context);
		}, 0);
	};

}());