(function() {
	'use strict';
	rap.registerTypeHandler("eclipsesource.graph", {
		factory : function(properties) {
			return new eclipsesource.graph(properties);
		},

		destructor : "destroy",
		methods : [ 'insertVertex', 'insertEdge','appendXmlModel','removeCells','putCellStyle','setCellStyle','translateCell',
		            'setCellChildOffset','setCellOffset','zoomIn','zoomOut','setTooltip','selectCell','selectCells','addCellOverlay',
		            'removeCellOverlays','graphLayout','resetView','updateEdgeStatus','updateNodeStatus','automic','loadData'],
		properties : [ "size", "xmlModel","prop","arrowOffset","textAutoRotation","controlarea","pageType"],
		events:['modelUpdate']
	});

	if (!window.eclipsesource) {
		window.eclipsesource = {};
	}

	eclipsesource.graph = function(properties) {
		console.log("graph....." + properties)
		bindAll(this, [ "layout", "onReady", "onSend", "onRender" ,"onConnect","mouseHover","autoSave","onRemove",
		                "onCellConnect","getTooltipForCell","onCellAdded","labelChanged","onGraphSizeChanged","debounce",
										"autoSaveOrigin"]);
		this.parent = rap.getObject(properties.parent);
		this.element = document.createElement("div");
		this.leftdiv = document.createElement("div");
		this.rightdiv = document.createElement("div");
		this.leftdiv.style.position = 'absolute';
		this.leftdiv.style.width = '100%';
		this.leftdiv.style.left = '0px';
		this.leftdiv.style.top = '0px';
		this.leftdiv.style.bottom = '0px';
		this.leftdiv.style.display = 'none';

		this.rightdiv.style.position = 'absolute';
		this.rightdiv.style.overflow = 'hidden';
		this.rightdiv.style.width = '100%';
		this.rightdiv.style.right = '0px';
		this.rightdiv.style.top = '10px';
		this.rightdiv.style.bottom = '10px';

		this.parent.append(this.element);
		this.element.appendChild(this.leftdiv);
		this.element.appendChild(this.rightdiv);

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
		this.rightdiv.appendChild(this.cover);

		mxConnector.arrowOffset = 1.0;
		mxConnector.prototype.paintEdgeShape = function(c, pts){
			var offset = mxConnector.arrowOffset;
			// The indirection via functions for markers is needed in
			// order to apply the offsets before painting the line and
			// paint the markers after painting the line.
			var ptss = [];
			var ptst = [];
			for(var i=0;i<pts.length;i++){
				ptss.push(pts[i].clone());
			}
			for(var i=0;i<pts.length;i++){
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

		this._graph = new Graph(this.rightdiv);
		this._parent = null;
		this._xmlModel = null;
		this._pagetype = null;
		this._currentSize = null;
		this._devicetype = null;
		this._chartLiquid = 1.00;
		this._chartPie = [0,0,0];
		this._hoverCell = null;
		this._tooltips = {};
		this._textAutoRotation = false;
		this._myChartOne = null;
		this._myChartTwo = null;
		this.autoSave = this.debounce(this.autoSaveOrigin,300);

		new HoverIcons(this._graph);

		this._graph.setAllowDanglingEdges(false);
		this._graph.setDisconnectOnMove(false);
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
				// Adds cells to the model in a single step
				graph.getModel().beginUpdate();
				try {
					if (this._xmlModel && this._xmlModel != null) {
						var xmlDocument = mxUtils.parseXml(this._xmlModel);
						var node = xmlDocument.documentElement;
						var decoder = new mxCodec(xmlDocument);
						decoder.decode(node, graph.getModel());
					}
				} finally {
					graph.getModel().endUpdate();
				}

				var parent = graph.getDefaultParent();
				this._parent = parent;
				graph.connectionHandler.addListener(mxEvent.CONNECT, this.onConnect);
				var mgr = new mxAutoSaveManager(graph);
				mgr.save = this.autoSave;
				graph.addListener(mxEvent.LABEL_CHANGED,this.labelChanged);
				graph.addListener(mxEvent.CELLS_ADDED,this.onCellAdded);
				graph.addListener(mxEvent.SIZE,this.onGraphSizeChanged);
				graph.addListener(mxEvent.CELLS_REMOVED,this.onRemove);
				graph.addListener(mxEvent.CELLS_RESIZED,this.onRemove);
				graph.addListener(mxEvent.CELLS_MOVED,this.onRemove);
				graph.addListener(mxEvent.CELL_CONNECTED,this.onCellConnect);
				var outln = new mxOutline(graph, this.outline);
				// rap.on("send", this.onSend);
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
		onCellAdded:function(){
			this.autoSave();
		},
		labelChanged:function(){
			this.autoSave();
		},
		onGraphSizeChanged:function(){
			this.autoSave();
		},
		onSend : function() {
			// var enc = new mxCodec(mxUtils.createXmlDocument());
			// var node = enc.encode(this._graph.getModel());
			// var xml = mxUtils.getXml(node);
			// rap.getRemoteObject( this ).set( "model", xml);
			console.log("mxgraph-rap...onSend!!");
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
					layout.nodeDistance = 30;
					layout.levelDistance = 100;
				}else if(type == 'stack'){
					var fast = new mxFastOrganicLayout(graph);
					fast.execute(parent);
					var layout = new mxStackLayout(graph,true,100,50,50,0);//stack
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
			if (f){
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
			this.autoSave();
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
			if (evt.properties.previous){
				ro.call(evt.name, {edge:je,source:evt.properties.source,
				terminal:term.id,previous:evt.properties.previous.id});
			}else{
				ro.call(evt.name, {edge:je,source:evt.properties.source,terminal:term.id});
			}
			this.autoSave();
		},

		onConnect:function(sender, evt) {
			mxConnector.arrowOffset = 0.5;
			var graph = this._graph;
			var edge = evt.getProperty('cell');
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
						mxConnector.arrowOffset = 0.75;
						if(OutSubedge.style.indexOf("startArrow=")!=-1){
							if(OutSubedge.style.indexOf("startArrow=none")!=-1){
								OutSubedge.style = OutSubedge.style.replace("startArrow=none","startArrow=classic");
								this._graph.getModel().setStyle(OutSubedge,OutSubedge.style);
							}
						}else{
							this._graph.getModel().remove(edge);
							var substyle = OutSubedge.style;
							var sem = substyle.substring(substyle.length-1,substyle.length);
							var temp = sem==";"?"":";";
							this._graph.getModel().setStyle(OutSubedge,OutSubedge.style+temp+"startArrow=classic;");
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

		autoSaveOrigin : function(){
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

		updateNodeStatus:function(obj){
			var model = this._graph.getModel();
			var totalArr = obj.array;
			var subNode = null;
			for(var i=0;i<totalArr.length;i++){
				subNode = totalArr[i];
				var node = model.getCell(subNode.id);
				if (node){
					this._tooltips[subNode.id] = subNode.tooltip;
					this._graph.removeCellOverlays(node);
					var overlay = new mxCellOverlay(new mxImage(subNode.overlay.image, subNode.overlay.width, subNode.overlay.height),subNode.overlay.tooltip);
					this._graph.addCellOverlay(node, overlay);
				}
			}
		},

		updateEdgeStatus:function(obj){
			var model = this._graph.getModel();
			var totalArr = obj.array;
			var subobj = null;
			var colorHead = "strokeColor=";
			var fontcolorHead = "fontColor=";
			var dashedHead = "dashed=";
			if(totalArr.length>0){
				for(var i=0;i<totalArr.length;i++){
					subobj = totalArr[i];
					var edge = model.getCell(subobj.id);
					if(edge!=null){
						var style = edge.style;
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
						if(subobj.arrow==1){//out flow
							mxConnector.arrowOffset = 0.5;
							if(style.indexOf("endArrow=none")>0){
								style = style.replace(/endArrow=none/g,"").replace(/;;/g,";");
							}
							if(style.indexOf("startArrow=classic")>0){
								if(style.indexOf("startArrow=none")>0){
									style = style.replace(/startArrow=classic/g,"").replace(/;;/g,";");
								}else{
									style = style.replace(/startArrow=classic/g,"startArrow=none").replace(/;;/g,";");
								}
							}
						}else if(subobj.arrow==-1){//in flow
							mxConnector.arrowOffset = 0.5;
							if(style.indexOf("endArrow=none")>0){
								style = style.replace(/endArrow=classic/g,"").replace(/;;/g,";");
							}else{
								if(style.indexOf("endArrow=classic")>0){
									style = style.replace(/endArrow=classic/g,"endArrow=none").replace(/;;/g,";");
								}else{
									var sem = style.substring(style.length-1,style.length);
									var temp = sem==";"?"":";";
									style += temp+"endArrow=none;";
								}
							}
							if(style.indexOf("startArrow=classic")>0){
								style = style.replace(/startArrow=none/g,"").replace(/;;/g,";");
							}else{
								if(style.indexOf("startArrow=none")>0){
									style = style.replace(/startArrow=none/g,"startArrow=classic").replace(/;;/g,";");
								}else{
									var sem = style.substring(style.length-1,style.length);
									var temp = sem==";"?"":";";
									style += temp+"startArrow=classic;";
								}
							}
						}else if(subobj.arrow==2){// total flow
							mxConnector.arrowOffset = 0.75;
							if(style.indexOf("endArrow=none")>0){
								style = style.replace(/endArrow=none/g,"").replace(/;;/g,";");
							}
							if(style.indexOf("startArrow=none")>0){
								style = style.replace(/startArrow=none/g,"startArrow=classic").replace(/;;/g,";");
							}else{
								if(style.indexOf("startArrow=classic")<0){
									var sem = style.substring(style.length-1,style.length);
									var temp = sem==";"?"":";";
									style += temp+"startArrow=classic;";
								}
							}
						}else if(subobj.arrow==0){// no arrow
							if(style.indexOf("endArrow=none")>0){
								style = style.replace(/endArrow=classic/g,"").replace(/;;/g,";");
							}else{
								if(style.indexOf("endArrow=classic")>0){
									style = style.replace(/endArrow=classic/g,"endArrow=none").replace(/;;/g,";");
								}else{
									var sem = style.substring(style.length-1,style.length);
									var temp = sem==";"?"":";";
									style += temp+"endArrow=none;";
								}
							}
							if(style.indexOf("startArrow=none")>0){
								style = style.replace(/startArrow=classic/g,"").replace(/;;/g,";");
							}else{
								if(style.indexOf("startArrow=classic")>0){
									style = style.replace(/startArrow=classic/g,"startArrow=none").replace(/;;/g,";");
								}else{
									var sem = style.substring(style.length-1,style.length);
									var temp = sem==";"?"":";";
									style += temp+"startArrow=none;";
								}
							}
						}
						model.setValue(edge,subobj.value==null?"":subobj.value);
						model.setStyle(edge,style);
						this.addChild(edge,subobj,model);//add line text
						this._tooltips[subobj.id] = subobj.tooltip;//add tooltips
					}
				}
			}
		},

		addChild:function(obj,subobj,model){
			var graph = this._graph;
			var geo = null;
			var edge = model.getCell(obj.id);
			if(edge.children!=null){
				var childrens = edge.children;
				var len = childrens.length;
				for(var i=0;i<len;i++){
					model.remove(childrens[0]);
				}
			}
			var style = 'text;html=1;resizable=0;points=[];align=center;verticalAlign=middle;spacingTop=25;labelBackgroundColor=none;labelBorderColor=none;';
			var fontcolor = "fontColor=";
			var index = edge.style.indexOf(fontcolor);
			style = style+edge.style.substring(index,index+fontcolor.length+7)+";";
			if(subobj.arrow==1){
				var end = graph.insertVertex(edge, null, subobj.endvalue, 1, 1, 0, 0,style, true);
				geo = new mxGeometry(0, 12, 0, 0);
				geo.relative = true;
				end.connectable = 0;
				end.setGeometry(geo);
			}else if(subobj.arrow==-1){
				var start = graph.insertVertex(edge, null, subobj.startvalue, 1, 1, 0, 0,style, true);
				geo = new mxGeometry(0, -12, 0, 0);
				geo.relative = true;
				start.connectable = 0;
				start.setGeometry(geo);
			}else if(subobj.arrow==2){
				var end = graph.insertVertex(edge, null, subobj.endvalue, 1, 1, 0, 0,style, true);
				end.connectable = 0;
				geo = new mxGeometry(0.48, 12, 0, 0);
				geo.relative = true;
				end.setGeometry(geo);
				var start = graph.insertVertex(edge, null, subobj.startvalue, 1, 1, 0, 0,style, true);
				geo = new mxGeometry(-0.48, -12, 0, 0);
				geo.relative = true;
				start.connectable = 0;
				start.setGeometry(geo);
			}else if(subobj.arrow==0){
				var end = graph.insertVertex(edge, null, subobj.endvalue, 1, 1, 0, 0,style, true);
				geo = new mxGeometry(0, 12, 0, 0);
				geo.relative = true;
				end.connectable = 0;
				end.setGeometry(geo);
			}
			this.updateEdgeText(edge);
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
					if(len>0){
						var sx = this.points[len-2].x;
						var sy = this.points[len-2].y;
						var dx = this.points[len-1].x;
						var dy = this.points[len-1].y;
					}
					var angle = Math.atan((dy-sy)/((dx-sx)==0?1:(dx-sx)))*360/(2*Math.PI);
					return angle;
				};
			}else{
				mxPolyline.prototype.getRotation = function()
				{
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
			this._currentSize = size;
		},

		destroy : function() {
			rap.off("send", this.onSend);
			this._myChartOne && this._myChartOne.dispose();
			this._myChartTwo && this._myChartTwo.dispose();
			this._myChartOne = null; this._myChartTwo = null;
			this._graph.removeMouseListener(this);
			this._graph.destroy();
			this.element.parentNode.removeChild(this.element);
		},

		automic : function(){
			var sizees = this._currentSize;
			var divs = this.rightdiv;
			if(sizees!=null&&divs!=null){
				while(true){//auto zommOut
					if(divs.scrollHeight>sizees.height&&divs.scrollWidth>sizees.width){
						break;
					}
					this._graph.zoomIn();
				}
				while(true){//auto zommOut
					if(divs.scrollHeight<=sizees.height&&divs.scrollWidth<=sizees.width){
						break;
					}
					this._graph.zoomOut();
				}
			}
		},

		loadData:function(obj){
			if(obj!=null){
				if(obj.device!=null){
					this._devicetype = obj.device;
				}
				if(obj.liquid!=null){
					this._chartLiquid = obj.liquid;
				}
				if(obj.pie!=null){
					this._chartPie = obj.pie;
				}
			}
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
			var divs = this.rightdiv;
			var sizees = this._size;
			divs.style.display = 'block';
			divs.style.width = '55%';
			this.leftdiv.style.display = 'block';
			this.createLeftDivContent();
			divs.style.overflow = 'auto';
			this._graph.setEnabled(false);
			this.cover.style.display = 'block';
			this.verticesOffset();
			this.cover.onmousedown = function(){
				var ro = rap.getRemoteObject(target)
				ro.call('OpenGraph', {
					'isOpen' : 'open'
				});
			};
			if(outlines){
				outlines.style.display = 'none';
			}
			while(true){//auto zommOut
				if(divs.scrollHeight<=sizees.height&&divs.scrollWidth<=(sizees.width*0.55).toFixed(0)){
					break;
				}
				this._graph.zoomOut();
			}
			divs.style.overflow = 'hidden';
		},

		verticesOffset:function(){
			var model = this._graph.getModel();
			var vertices = model.getChildVertices(this._graph.getDefaultParent());
			var canwidth = this.rightdiv.scrollWidth;
			var canheight = this.rightdiv.scrollHeight;
			var minX = 10000;
			var maxX = 0;
			var minY = 10000;
			var maxY = 0;
			$.each(vertices,function(index,mxCell){
				minX = Math.min(minX,mxCell.geometry.x);
				maxX = Math.max(maxX,mxCell.geometry.x);
				minY = Math.min(minY,mxCell.geometry.y);
				maxY = Math.max(maxY,mxCell.geometry.y);
			});
			var offsets = (minX+maxX)/2-canwidth/2;
			console.log(offsets);
			if(minX>87){
				$.each(vertices,function(index,mxCell){
					mxCell.geometry.x -= (minX-87);
				});
			}
		},

		createLeftDivContent:function(){
			$(this.leftdiv).css("width","45%");
			this.createTable();
			this.createChart();
			this.createFoot();
		},

		createChart:function(){
			var chartdiv = document.createElement("div");
			$(this.leftdiv).append(chartdiv);
			$(chartdiv).css({"height":"166px"});
			this.createChartOne(chartdiv);
			this.createChartTwo(chartdiv);
			$(chartdiv).addClass("chartdiv");
			$(".chartdiv div").css("float","left");
		},

		createTable:function(){
			var divone = document.createElement("div");
			var table = document.createElement("table");
			$(divone).append(table);
			$(divone).css({"height":"152px"});
			$(this.leftdiv).append(divone);
			$(table).addClass("ttable");
			$(table).css({"border-collapse":"collapse","padding":"0","margin-left":"8px","margin-top":"12px","width":"340px","text-align":"center","table-layout":"fixed"});
			$(table).append("<tr class='mhead' style='height:25px;background:#d4e1f0;'><td>类型</td><td>资源</td><td>正常</td><td>危险</td><td>错误</td></tr>");
			$(".mhead").css({"font-weight":"bolder","color":"#000000"});
			var devicetype = [
                  ['服务器','0','0','0','0'],
                  ['交换机','0','0','0','0'],
                  ['路由器','0','0','0','0'],
                  ['数据库','0','0','0','0'],
                  ['中间件','0','0','0','0'],
                  ['负载','0','0','0','0'],
                  ['虚拟机','0','0','0','0'],
                  ['存储','0','0','0','0'],
                  ['防火墙','0','0','0','0']
			];

			if(this._devicetype!=null){
				devicetype = this._devicetype;
			}
			var more = document.createElement("div");
			var mores = document.createElement("div");
			$(more).css({"text-align":"center","height":"15px"});
			$(mores).css({"display":"none","text-align":"center"});
			$(this.leftdiv).append(more);
			$(this.leftdiv).append(mores);
			var mtable = document.createElement("table");
			$(mtable).addClass("ttable");
			$(mtable).css({"border-collapse":"collapse","padding": "0","width":"340px","margin-left":"8px","margin-top":"0px","table-layout":"fixed"});
			$(mores).append(mtable);
			var textcolor = null;
			var bgcolor = null;
			$.each(devicetype,function(index,item){
				var tr = document.createElement("tr");
				if(index<=4){
					$(table).append(tr);
				}else{
					$(mtable).append(tr);
				}
				$(tr).addClass("othertr");
				$(tr).css({"height":"25px"});
				$(tr).append("<td style='font-weight:bolder;font-color:#333333;' title="+item[0]+">"+"<span>"+item[0]+"</span>"+"</td>");
				$(tr).append("<td style='font-color:#333333' title="+item[1]+">"+"<span>"+item[1]+"</span>"+"</td>");
				$(tr).append("<td style='font-color:#333333' title="+item[2]+">"+"<span>"+item[2]+"</span>"+"</td>");
				var html = "<td style='color:#fff' title="+item[3]+">"+"<div style='margin:auto;padding:0px 5px;border-radius:50%;width:20px;width:auto;display:inline-block !important;background:#f69446;'>"+"<span>"+item[3]+"</span>"+"</div>"+"</td>";
				textcolor = item[3]=="0"?"#333333":"#fff";
				bgcolor = item[3]=="0"?"":"#f69446";
				$(tr).append("<td style='color:"+textcolor+"' title="+item[3]+">"+"<div style='margin:auto;padding:0px 5px;border-radius:50%;width:20px;width:auto;display:inline-block !important;background:"+bgcolor+"'>"+"<span>"+item[3]+"</span>"+"</div>"+"</td>");
				textcolor = item[4]=="0"?"#333333":"#fff";
				bgcolor = item[4]=="0"?"":"#f93b3b";
				$(tr).append("<td style='color:"+textcolor+"' title="+item[4]+">"+"<div style='margin:auto;padding:0px 5px;border-radius:50%;width:20px;width:auto;display:inline-block !important;background:"+bgcolor+"'>"+"<span>"+item[4]+"</span>"+"</div>"+"</td>");
			});
			$(".ttable .othertr").mouseover(function(){
				$(this).css("background","#d7e1ed");
			});
			$(".ttable .othertr").mouseout(function(){
				$(this).css("background","#ebf5ff");
			});
			$(".ttable tr").css("font-size","11px");
			$(".ttable").css({"border-top":"1px solid #d6d6d6","border-left":"1px solid #d6d6d6","border-right":"1px solid #d6d6d6"});
			$(".ttable td").css({"text-overflow":"ellipsis","overflow":"hidden","border-bottom":"1px solid #d6d6d6"});
			if(devicetype.length>6){
				var img = document.createElement("img");
				$(img).attr({"src":"rwt-resources/graph/images/down.png","title":"点击查看更多"});
				$(more).append(img);
				$(img).css({"width":"30px","height":"11px","margin-bottom":"15px","cursor":"pointer"});
				$(img).click(function(){
					if($(img).attr("src")=='rwt-resources/graph/images/down.png'){
						$(img).attr("src","rwt-resources/graph/images/up.png");
						$(img).attr("title","点击收起");
					}else{
						$(img).attr("src","rwt-resources/graph/images/down.png");
						$(img).attr("title","点击查看更多");
					}
					$(mores).slideToggle("fast");
				});
			}
		},

		createChartOne:function(chartdiv){
			var chartdiv1 = document.createElement("div");
			$(chartdiv1).css({"height":"100%","width":"50%"});
			chartdiv.appendChild(chartdiv1);
			var myChart = this._myChartOne = echarts.init(chartdiv1);
			var health = this._chartLiquid;
			var colors = ['#8fe9b5', '#32e17a', new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                offset: 0, color: 'rgba(56, 200, 125, 1)'
            }, {
                offset: 1, color: 'rgba(124, 252, 122, 1)'
            }], false)];   //good
			if(health<0.1){
				colors = ['#ff6f6f', '#f62121', new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
	                offset: 0, color: 'rgba(251, 26, 26, 1)'
	            }, {
	                offset: 1, color: 'rgba(244, 86, 86, 1)'
	            }], false)];   //error
			}else if(health>=0.1&&health<0.35){
				colors = ['#ff6f6f', '#f93b3b', new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
	                offset: 0, color: 'rgba(255, 51, 0, 1)'
	            }, {
	                offset: 1, color: 'rgba(255, 98, 98, 1)'
	            }], false)];   //danger
			}else if(health>=0.35&&health<0.68){
				colors = ['#ffb77d', '#f69446', new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
	                offset: 0, color: 'rgba(255, 147, 64, 1)'
	            }, {
	                offset: 1, color: 'rgba(255, 199, 117, 1)'
	            }], false)];   //warning
			}
			var option = {
			    series: [{
			        type: 'liquidFill',
			        name: 'sdfsdfsd',
			        animation: true,
			        waveAnimation: true,
			        data: [health, health-0.04, health-0.06],
			        color: colors,
			        center: ['50%', '50%'],
			        waveLength: '90%',
			        amplitude: 3,
			        radius: '82%',
			        label: {
			            normal: {
			    			formatter: (health*100).toFixed(0)+'分',
			                textStyle: {
			                    fontSize: 26,
			                    fontWeight: 'lighter',
			                    color: colors[1]
			                },
			                position: ['50%', '50%']
			            }
			        },
			        outline: {
			            itemStyle: {
			                borderColor: colors[1],
			                borderWidth: 1
			            },
			            borderDistance: 2
			        },
			        backgroundStyle: {
			            color: '#fff'
			        },
			        itemStyle: {
			            normal: {
			                shadowBlur: 0,
			            }
			        },
			    }]
			};
			myChart.setOption(option, true);
		},

		createChartTwo:function(chartdiv){
			var chartdiv2 = document.createElement("div");
			$(chartdiv2).css({"height":"100%","width":"50%"});
			chartdiv.appendChild(chartdiv2);
			var myChart = this._myChartTwo = echarts.init(chartdiv2);
			var option = {
			    tooltip : {
			        trigger: 'item',
			    },
			    series : [
			        {
			            type: 'pie',
			            radius : '82%',
			            center: ['50%', '48%'],
			            data:[
			                {	value:this._chartPie[0],
												name:this._chartPie[0]!=0?'正常':'',
												itemStyle:{normal:{color: new echarts.graphic.RadialGradient(0,1, 2, [{
												  offset: 0, color: '#b0eacc'
													}, {
													  offset: 1, color: '#03b156'
													}], false)}
												}
											},
			                {	value:this._chartPie[1],
												name:this._chartPie[1]!=0?'危险':'',
												itemStyle:{normal:{color: new echarts.graphic.RadialGradient(1,0, 2, [{
													offset: 0, color: '#ecc5a5'
													}, {
														offset: 1, color: '#c15905'
													}], false)}
												}
											},
			                {	value:this._chartPie[2],
												name:this._chartPie[2]!=0?'错误':'',
												itemStyle:{normal:{color: new echarts.graphic.RadialGradient(1,1, 2, [{
													offset: 0, color: '#f1bcbc'
													}, {
														offset: 1, color: '#bd0606'
													}], false)}
												}
											}
			            ],
			            color:['#03b156','#c15905','#bd0606'],
			            label: {
			                normal: {
			                    show: true,
			                    position: 'inner'
			                },
			            },
			            backgroundStyle: {
				            color: '#000'
				        },
			            itemStyle: {
											normal:{
												// shadowBlur: 3,
												// shadowOffsetX: 2,
												// shadowOffsetY: 5,
												// shadowColor: '#848080'
											},
			                emphasis: {
			                    shadowBlur: 8,
													shadowOffsetX: 2,
			                    shadowOffsetY: 3,
			                    shadowColor: 'rgba(0, 0, 0, 0.5)'
			                }
			            }
			        }
			    ]
			};
			myChart.setOption(option);
		},

		createFoot:function(){
			var foot = document.createElement("div");
			$(foot).css({"height":"20px","width":"100%","margin-top":"-22px","text-align":"center","position":"absolute","font-color":"#333333","font-weight":"bolder","font-size":"12px"});
			$(this.leftdiv).append(foot);
			$(foot).append("网络健康度");
		},
		debounce :function(func, wait, immediate) {
	    var timeout, args, context, timestamp, result;

	    var later = function() {
	      var last = now() - timestamp;

	      if (last < wait && last >= 0) {
	        timeout = setTimeout(later, wait - last);
	      } else {
	        timeout = null;
	        if (!immediate) {
	          result = func.apply(context, args);
	          if (!timeout) context = args = null;
	        }
	      }
	    };
	    return function() {
	      context = this;
	      args = arguments;
	      timestamp = now();
	      var callNow = immediate && !timeout;
	      if (!timeout) timeout = setTimeout(later, wait);
	      if (callNow) {
	        result = func.apply(context, args);
	        context = args = null;
	      }

	      return result;
	    };
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
	var now = Date.now || function() {
		return new Date().getTime();
	};

}());
