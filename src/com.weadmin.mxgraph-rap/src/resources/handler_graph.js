

(function() {
	'use strict';


	rap.registerTypeHandler("eclipsesource.graph", {

		factory : function(properties) {
			return new eclipsesource.graph(properties);
		},

		destructor : "destroy",
		methods : [ 'insertVertex', 'insertEdge','appendXmlModel','removeCells',
		            'putCellStyle','setCellStyle','translateCell','setCellChildOffset','setCellOffset','zoomIn','zoomOut',
		            'setTooltip','selectCell','selectCells','addCellOverlay','removeCellOverlays','graphLayout','resetView',"arrowVisible",
		            "updateEdgeStatus","updateNodeStatus","resetEdges"],
		properties : [ "size", "xmlModel","prop","arrowOffset","textAutoRotation","controlarea","pageType"],
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
		this.element.style.overflow = 'hidden';
		this.parent.append(this.element);
		this.parent.addListener("Resize", this.layout);
		this._size = properties.size ? properties.size : {
			width : 300,
			height : 300
		};

		this.outline = document.createElement("div");
		this.outline.style.zIndex = '2';
		this.outline.style.position = 'absolute';
		this.outline.style.overflow = 'hidden';
		this.outline.style.bottom = '1px';
		this.outline.style.right = '1px';
		this.outline.style.width = '250px';
		this.outline.style.height = '160px';
		this.outline.style.background = 'transparent';
		this.outline.style.border='solid gray';

		this.parent.append(this.outline);

		this.cover = document.createElement("div");
		this.cover.style.zIndex = '1';
		this.cover.style.position = 'absolute';
		this.cover.style.overflow = 'hidden';
		this.cover.style.left = '0px';
		this.cover.style.top = '0px';
		this.cover.style.bottom = '0px';
		this.cover.style.right = '0px';
		this.cover.style.background = 'transparent';
		this.cover.style.display = 'none';
		this.cover.onmouseover = function(){
			this.style.cursor = 'pointer';
		};
		this.parent.append(this.cover);
		mxConnector.arrowOffset = 1.0;
		mxConnector.prototype.paintEdgeShape = function(c, pts){
			var offset = mxConnector.arrowOffset;
			// The indirection via functions for markers is needed in
			// order to apply the offsets before painting the line and
			// paint the markers after painting the line.
			var ptss = [];
			var ptst = [];
			for(var i in pts){
				if(pts[i]!=null){
					ptss.push(pts[i].clone());
				}
			}
			for(var i in pts){
				if(pts[i]!=null){
					ptst.push(pts[i].clone());
				}
			}
			if (offset < 1){
				ptss[0].x = pts[1].x+(pts[0].x-pts[1].x)*offset;//(pts[0].x+pts[1].x)/2;
				ptss[0].y = pts[1].y+(pts[0].y-pts[1].y)*offset;//(pts[0].y+pts[1].y)/2;
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
			if (sourceMarker != null){
				sourceMarker();
			}
			if (targetMarker != null){
				targetMarker();
			}
		},

		// Disables the built-in context menu
		mxEvent.disableContextMenu(this.element);
		HoverIcons.prototype.checkCollisions = false;
		mxTooltipHandler.prototype.zIndex = 1000500000;
		mxConnectionHandler.prototype.waypointsEnabled = false;

		this._graph = new Graph(this.element);
		this._parent = null;
		this._xmlModel = null;
		this._hoverCell = null;
		this._pagetype = null;
		this._tooltips = {};
		this._textAutoRotation = false;

		new HoverIcons(this._graph);

		this._graph.setAllowDanglingEdges(false);
		this._graph.setDisconnectOnMove(false);
		this._graph.setMultigraph(true);
		this._graph.ignoreScrollbars = true;
		this._graph.allowNegativeCoordinates = false;
		this._graph.centerZoom = false;
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

				var outln = new mxOutline(graph, this.outline);
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
		},

		appendXmlModel : function(model) {

			var graph = this._graph;

			var doc = mxUtils.parseXml(model.content);
			var codec = new mxCodec(doc);
			codec.lookup = function(id){
				return graph.getModel().getCell(id);
			}
			var n = codec.decode(doc.documentElement);
			n.parent = null;
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
		graphLayout:function(obj){
			var type = obj.type;
			var graph = this._graph;
			var parent = graph.getDefaultParent();
			graph.getModel().beginUpdate();
			try{
				mxCompactTreeLayout.prototype.resetEdges = false;
				mxCompactTreeLayout.prototype.edgeRouting = false;
				mxHierarchicalLayout.prototype.disableEdgeStyle = false;
				mxHierarchicalLayout.prototype.edgeStyle = "edgeStyle=straightEdgeStyle;";
				var layouts = new mxStackLayout(graph);
				layouts.execute(parent);
				if(type == 'circle'){
					var layout = new mxCircleLayout(graph,300);//circle
				}else if(type == 'tree'){
					var layout = new mxCompactTreeLayout(graph);//tree
					//layout.moveTree = true;
					layout.nodeDistance = 30;
					layout.levelDistance = 100;
				}else if(type == 'stack'){
					var fast = new mxFastOrganicLayout(graph);
					fast.execute(parent);
					var layout = new mxStackLayout(graph,true,100,0,0,0);//stack
				}else if(type == 'partition'){
					var layout = new mxPartitionLayout(graph);//partition
				}else if(type == 'hierarchical'){
					var layout = new mxHierarchicalLayout(graph);//hierarchical
				}else if(type == 'fast'){
					var layout = new mxFastOrganicLayout(graph);//fastorganic
				}
				layout.execute(parent);
				var edges = graph.getModel().getChildEdges(parent);
				for(var j in edges){
					this.updateEdgeText(edges[j]);
				}
			} finally {
				var morph = new mxMorphing(graph);
				morph.addListener(mxEvent.DONE, function()
				{
					graph.getModel().endUpdate();
				});
				morph.startAnimation();
			}
		},
		resetView:function(obj){
			var graph = this._graph;
			graph.view.scaleAndTranslate(1, 0, 0);
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
						this.updateEdgeText(edges[j]);
					}
				}
			}

			ro.call(evt.name, {
				ids :ids
			});
		},
		
		updateEdgeText:function(edge){//text auto ratation
			var e = edge;
			if (e.children && e.children.length>0){
				for(var i=0;i<e.children.length;i++){
					var text = e.children[i];
					var sx = e.source.getGeometry().getCenterX();
					var sy = e.source.getGeometry().getCenterY();
					var dx = e.target.getGeometry().getCenterX();
					var dy = e.target.getGeometry().getCenterY();
					var angle = Math.atan((dy-sy)/(dx-sx))*360/(2*Math.PI);
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
					var data = {id:text.id};
					data.offsetX=15*Math.sin(angle*0.017453293)
					data.offsetY=-15*Math.cos(angle*0.017453293)
					this.setCellOffset(data)
				}
			}
		},
		
		onCellConnect:function(sender,evt){
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
			//edge.value = '100Kbps';
			var styles = 'edgeStyle=none;rounded=0;html=1;strokeColor=#000000;fontColor=#000000;dashed=0;';
			edge.style = styles;
			var geo = new mxGeometry(0, -10, 0, 0);
			geo.relative = true;
			edge.setGeometry(geo);

			//判断是否自动反转箭头
			var tarcell = this._graph.getModel().getCell(edge.target.id);
			var rescell = this._graph.getModel().getCell(edge.source.id);
			var haveline = false;
			var havelines = false;
			var tarStyle = tarcell.getStyle();
			var resStyle = rescell.getStyle();
			var levelValue1 = null;
			var levelValue2 = null;
			var resourceLevel = "resourceLevel=";
			var OutSubedge = null;
			var InSubedge = null;
			if(tarStyle.indexOf(resourceLevel)!=-1&&resStyle.indexOf(resourceLevel)!=-1){
				levelValue1 = tarStyle.substring(tarStyle.indexOf(resourceLevel)+resourceLevel.length,tarStyle.indexOf(resourceLevel)+resourceLevel.length+1);
				levelValue2 = resStyle.substring(resStyle.indexOf(resourceLevel)+resourceLevel.length,resStyle.indexOf(resourceLevel)+resourceLevel.length+1);
			}
			var source = graph.getModel().getTerminal(edge, true);
			var target = graph.getModel().getTerminal(edge, false);

			var targetOutgoingEdge = this._graph.getModel().getOutgoingEdges(tarcell);
			var targetIncomingEdge = this._graph.getModel().getIncomingEdges(tarcell);
			for(var i=0;i<targetOutgoingEdge.length;i++){
				OutSubedge = targetOutgoingEdge[i];
				if(OutSubedge.target.id==edge.source.id){
					haveline = true;
					break;
				}
			}
			for(var i=0;i<targetIncomingEdge.length;i++){
				InSubedge = targetIncomingEdge[i];
				if(InSubedge.source.id==edge.source.id){
					if(InSubedge.id!=edge.id){
						havelines = true;
						break;
					}
				}
			}
			if(levelValue1!=null&&levelValue2!=null){
				if(levelValue1<levelValue2){
					if(haveline){
						this._graph.getModel().remove(edge);
					}else{
						var id = edge.id;
						var value = edge.value;
						this._graph.getModel().remove(edge);
						var newedge = this._graph.insertEdge(this._parent, id, value, target, source , styles);
						newedge.setGeometry(geo);
					}
				}else{
					if(haveline){
						if(OutSubedge.style.indexOf("startArrow=")!=-1){
							if(OutSubedge.style.indexOf("startArrow=none")!=-1){
								OutSubedge.style = OutSubedge.style.replace("startArrow=none","arrowcounts=2;startArrow=classic");
								this._graph.getModel().setStyle(OutSubedge,OutSubedge.style);
							}
						}else{
							this._graph.getModel().remove(edge);
							var substyle = OutSubedge.style;
							var sem = substyle.substring(substyle.length-1,substyle.length);
							var temp = sem==";"?"":";";
							this._graph.getModel().setStyle(OutSubedge,OutSubedge.style+temp+"arrowcounts=2;startArrow=classic;");
						}
					}
					if(havelines){
						this._graph.getModel().remove(edge);
					}
				}
			}
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

		arrowVisible:function(obj){
			var serverids = obj.serverids;
			var type = obj.type;
			var outgoing = false;
			var incoming = false;
			var both = false;
			var oldstyle = null;
			if(type=='in'){
				incoming = true;
			}
			if(type=='out'){
				outgoing = true;
			}
			if(type=='both'){
				both = true;
			}
			for(var i=0;i<serverids.length;i++){
				var server = this._graph.getModel().getCell(serverids[i]);
				var incomingedge = this._graph.getModel().getIncomingEdges(server);
				for(var j=0;j<incomingedge.length;j++){
					var edge = incomingedge[j];
					var style = edge.style;
					oldstyle = edge.style;
					var children = edge.children;
					if(outgoing){
						var sem = style.substring(style.length-1,style.length);
						var temp = sem==";"?"":";";
						style += temp+"endArrow=none;";
						if(children!=null){
							children[0].setVisible(false);
						}else{
							if(style.indexOf("arrowcounts=2")>0){
								style += "startArrow=classic;";
							}
						}
						if(children!=null&&children.length==2){
							style += "startArrow=classic;";
							children[1].setVisible(true);
						}
					}
					if(incoming){
						var sem = style.substring(style.length-1,style.length);
						var temp = sem==";"?"":";";
						style += temp+"endArrow=classic;";
						if(children!=null){
							children[0].setVisible(true);
						}else{
							if(style.indexOf("arrowcounts=2")>0){
								style += "startArrow=none;";
							}
						}
						if(children!=null&&children.length==2){
							style += "startArrow=none;";
							children[1].setVisible(false);
						}
					}
					if(both){
						if(style.indexOf("endArrow=none")>0){
							style = style.replace(/endArrow=none/g,"endArrow=classic");
						}else{
							var sem = style.substring(style.length-1,style.length);
							var temp = sem==";"?"":";";
							style += temp+"endArrow=classic;";
						}
						if(children!=null){
							children[0].setVisible(true);
							if(children.length==2){
								style += "startArrow=classic;";
								children[1].setVisible(true);
							}
						}
					}
					this._graph.getModel().setStyle(edge,style);
					edge.style = oldstyle;
				}
				var outgoingedge = this._graph.getModel().getOutgoingEdges(server);
				for(var j=0;j<outgoingedge.length;j++){
					var edge = outgoingedge[j];
					var style = edge.style;
					oldstyle = edge.style;
					var children = edge.children;
					if(outgoing){
						var sem = style.substring(style.length-1,style.length);
						var temp = sem==";"?"":";";
						style += temp+"endArrow=classic;";
						if(children!=null){
							children[0].setVisible(true);
						}else{
							if(style.indexOf("arrowcounts=2")>0){
								style += "startArrow=none;";
							}
						}
						if(children!=null&&children.length==2){
							style += "startArrow=none;";
							children[1].setVisible(false);
						}
					}
					if(incoming){
						var sem = style.substring(style.length-1,style.length);
						var temp = sem==";"?"":";";
						style += temp+"endArrow=none;";
						if(children!=null){
							children[0].setVisible(false);
						}else{
							if(style.indexOf("arrowcounts=2")>0){
								style += "startArrow=classic;";
							}
						}
						if(children!=null&&children.length==2){
							style += "startArrow=classic;";
							children[1].setVisible(true);
						}
					}
					if(both){
						if(style.indexOf("endArrow=none")>0){
							style = style.replace(/endArrow=none/g,"endArrow=classic");
						}else{
							var sem = style.substring(style.length-1,style.length);
							var temp = sem==";"?"":";";
							style += temp+"endArrow=classic;";
						}
						if(children!=null){
							children[0].setVisible(true);
							if(children.length==2){
								style += "startArrow=classic;";
								children[1].setVisible(true);
							}
						}
					}
					this._graph.getModel().setStyle(edge,style);
					edge.style = oldstyle;
				}
			}
		},
		
		updateNodeStatus:function(obj){
			var totalArr = obj.array;
			var subNode = null;
			for(var i=0;i<totalArr.length;i++){
				subNode = totalArr[i];
				var node = this._graph.getModel().getCell(subNode.id);
				if (node){
					this._tooltips[subNode.id] = subNode.tooltip;
					this._graph.removeCellOverlays(node);
					var overlay = new mxCellOverlay(new mxImage(subNode.overlay.image, subNode.overlay.width, subNode.overlay.height),subNode.overlay.tooltip);
					this._graph.addCellOverlay(node, overlay);
				}
			}
		},

		updateEdgeStatus:function(obj){
			var totalArr = obj.array;
			var subobj = null;
			var colorHead = "strokeColor=";
			var fontcolorHead = "fontColor=";
			var dashedHead = "dashed=";
			if(totalArr.length>0){
				for(var i=0;i<totalArr.length;i++){
					subobj = totalArr[i];
					var edge = this._graph.getModel().getCell(subobj.id);
					if(edge!=null){
						var style = edge.style;
						var arrowcounts = style.indexOf("arrowcounts=2;");
						if(arrowcounts>0){
							style = style.replace("arrowcounts=2;","");
						}
						var index = style.indexOf(colorHead);
						if(index!=-1){// line color
							var colorvalue = style.substring(index+colorHead.length,index+colorHead.length+7);
							style = style.replace(colorHead+colorvalue,colorHead+subobj.color);
						}else{
							var sem = style.substring(style.length-1,style.length);
							var temp = sem==";"?"":";";
							style += temp+colorHead+subobj.color+";";
						}
						index = style.indexOf(fontcolorHead);
						if(index!=-1){// font color
							var fontvalue = style.substring(index+fontcolorHead.length,index+fontcolorHead.length+7);
							style = style.replace(fontcolorHead+fontvalue,fontcolorHead+subobj.color);
						}else{
							var sem = style.substring(style.length-1,style.length);
							var temp = sem==";"?"":";";
							style += temp+fontcolorHead+subobj.color+";";
						}
						index = style.indexOf(dashedHead);
						if(index!=-1){// dashed
							var dashedvalue = style.substring(index+dashedHead.length,index+dashedHead.length+1);
							style = style.replace(dashedHead+dashedvalue,dashedHead+subobj.dashed);
						}else{
							var sem = style.substring(style.length-1,style.length);
							var temp = sem==";"?"":";";
							style += temp+dashedHead+subobj.dashed+";";
						}
						if(subobj.arrow==1){//judge one or two arrow
							var sem = style.substring(style.length-1,style.length);
							var temp = sem==";"?"":";";
							if(style.indexOf("startArrow=classic")>0){
								if(style.indexOf("startArrow=none")>0){
									style = style.replace(/startArrow=none/g,"").replace(/;;/g,";");;
								}
							}else{
								style += temp+"startArrow=classic"+";";
							}
						}else if(subobj.arrow==0){
							if(style.indexOf("startArrow=classic")>0){
								style = style.replace(/startArrow=classic/g,"").replace(/;;/g,";");;
							}
						}
						this._graph.getModel().setStyle(edge,style);
						this.addChild(edge,subobj);//add line text
						this._tooltips[subobj.id] = subobj.tooltip;//add tooltips
					}
				}
			}
		},
		
		addChild:function(obj,subobj){
			var graph = this._graph;
			var geo = null;
			var edge = this._graph.getModel().getCell(obj.id);
			if(edge.children!=null){
				var childrens = edge.children;
				var len = childrens.length;
				for(var i=0;i<len;i++){
					this._graph.getModel().remove(childrens[0]);
				}
			}
			var style = 'text;html=1;resizable=0;points=[];align=center;verticalAlign=middle;spacingTop=25;labelBackgroundColor=none;labelBorderColor=none;';
			var fontcolor = "fontColor=";
			var index = edge.style.indexOf(fontcolor);
			style = style+edge.style.substring(index,index+fontcolor.length+7)+";";
			if(subobj.arrow==0){
				var end = graph.insertVertex(edge, null, subobj.endvalue, 1, 1, 0, 0,style, true);
				end.connectable = 0;
				geo = new mxGeometry(0.6, 12, 0, 0);
				geo.relative = true;
				end.setGeometry(geo);
			}else if(subobj.arrow==1){
				var end = graph.insertVertex(edge, null, subobj.endvalue, 1, 1, 0, 0,style, true);
				end.connectable = 0;
				geo = new mxGeometry(0.6, 12, 0, 0);
				geo.relative = true;
				end.setGeometry(geo);
				var start = graph.insertVertex(edge, null, subobj.startvalue, 1, 1, 0, 0,style, true);
				geo = new mxGeometry(-0.6, -12, 0, 0);
				geo.relative = true;
				start.connectable = 0;
				start.setGeometry(geo);
			}
			this.updateEdgeText(edge);
		},
		
		resetEdges:function(){
			var style = 'edgeStyle=none;rounded=0;html=1;strokeColor=#000000;fontColor=#000000;dashed=0;';
			var edges = this._graph.getModel().getChildEdges(this._graph.getDefaultParent());
			console.log(edges.length);
			if(edges!=null){
				for(var i=0;i<edges.length;i++){
					var edge = edges[i];
					this._graph.getModel().setStyle(edge,style);
					var children = edge.children;
					if(children!=null){
						var len = children.length;
						for(var j=0;j<len;j++){
							this._graph.getModel().remove(children[0]);
						}
					}
				}
			}
		},

		setArrowOffset : function(v){
			mxConnector.arrowOffset = v;
		},

		setControlarea : function(value){
			this.outline.style.display = value;
		},

		setPageType : function(type){
			this._pagetype = type;
		},

		setTextAutoRotation : function(v){
			this._textAutoRotation = v;
			if (v){
				mxPolyline.prototype.getRotation = function()
				{
					var len = this.points.length;
					if(len>3){
						var sx = this.points[len-3].x;
						var sy = this.points[len-3].y;
						var dx = this.points[len-2].x;
						var dy = this.points[len-2].y;
					}else{
						var sx = this.points[len-2].x;
						var sy = this.points[len-2].y;
						var dx = this.points[len-1].x;
						var dy = this.points[len-1].y;
					}
					var angle = Math.atan((dy-sy)/((dx-sx)==0?1:(dx-sx)))*360/(2*Math.PI);
					return angle;
				};
			}else{
				mxPolyline.prototype.getRotation = function(){
					return 0;
				};
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
			if(this._pagetype=='small'){
				this.smallpage(this);
			}
			console.log("graph...layout..")
			if (this.ready) {
				var area = this.parent.getClientArea();
				this.element.style.left = area[0] + "px";
				this.element.style.top = area[1] + "px";
				this.element.style.width = area[2] + "px";
				this.element.style.height = area[3] + "px";
			}
		},

		smallpage : function(target){
			var outlines = this.outline;
			var divs = this.element;
			var sizees = this._size;
			divs.style.overflow = 'auto';
			this._graph.setEnabled(false);
			this.cover.style.display = 'block';
			this.cover.onmouseup = function(){
				var ro = rap.getRemoteObject(target)
				ro.call('OpenGraph', {
					OpenGraph : true
				});
			};
			if(outlines){
				outlines.style.display = 'none';
				outlines.style.width = sizees.width/5 + "px";
				outlines.style.height = sizees.height/5 + "px";
			}
			while(true){//auto zommOut
				if(divs.scrollHeight<=sizees.height&&divs.scrollWidth<=sizees.width){
					console.log(divs.scrollHeight);
					break;
				}
				this._graph.zoomOut();
			}
			divs.style.overflow = 'hidden';
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
