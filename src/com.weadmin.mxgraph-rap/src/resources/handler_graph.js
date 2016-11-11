

(function() {
	'use strict';


	rap.registerTypeHandler("eclipsesource.graph", {

		factory : function(properties) {
			return new eclipsesource.graph(properties);
		},

		destructor : "destroy",
		methods : [ 'insertVertex', 'insertEdge','appendXmlModel','removeCells',
		            'putCellStyle','setCellStyle','translateCell'],
		properties : [ "size", "xmlModel","prop"],
		events:['modelUpdate']

	});

	if (!window.eclipsesource) {
		window.eclipsesource = {};
	}

	eclipsesource.graph = function(properties) {
		console.log("graph....." + properties)
		bindAll(this, [ "layout", "onReady", "onSend", "onRender" ,"onConnect","mouseHover","autoSave","onRemove","onCellConnect"]);
		this.parent = rap.getObject(properties.parent);
		this.element = document.createElement("div");
		this.parent.append(this.element);
		this.parent.addListener("Resize", this.layout);

		this._size = properties.size ? properties.size : {
			width : 300,
			height : 300
		};
		
		// Disables the built-in context menu
		mxEvent.disableContextMenu(this.element);
		
		this._graph = new Graph(this.element);
		this._parent = null;
		this._xmlModel = null;
		this._hoverCell = null;

		this._graph.setAllowDanglingEdges(false);
		this._graph.setDisconnectOnMove(false);
		this._graph.setConnectable(true);
		
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
			if (this._text) {
				// this.setText( this._text );
				delete this._text;
			}
			if (this._font) {
				// this.setFont( this._font );
				delete this._font;
			}
			console.log("graph...onReady..")

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

		onSend : function() {
			// if( this.editor.checkDirty() ) {
			// rap.getRemoteObject( this ).set( "text", this.editor.getData() );
			// this.editor.resetDirty();
			// }
			var enc = new mxCodec(mxUtils.createXmlDocument());
			var node = enc.encode(this._graph.getModel());
			var xml = mxUtils.getXml(node);
			//rap.getRemoteObject( this ).set( "model", xml);
			//console.log("graph...onSend..")
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
			console.log(n);
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

		setProp:function(data){
			var name = data.name;
			var val = data.value;
			var fn = "set"+name.substr(0,1).toUpperCase()+name.substr(1,name.length-1);
			var f = this._graph[fn];
			console.log(fn);
			if (f){
				console.log(f);
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
			var cells = [];
			cells.push(cell);
			
			this._graph.setCellStyle(data.style,cells);

			
		},
		
		setCellChildStyle:function(data){
			var cell = this._graph.getModel().getCell(data.id);
			if (cell){
				var label = cell.getChildAt(data.index);
				if (label){
					var cells = [];
					cells.push(label);
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
//		setCellChildGeometry:function(data){
//			var cell = this._graph.getModel().getCell(data.id);
//			if (cell){
//				var child = cell.getChildAt(data.index);
//				if (child){
//					var cells = [];
//					cells.push(child);
//					this._graph.setCellStyle(data.style,cells);
//				}
//			}
//		},
		
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
			console.log(evt)
			var ro = rap.getRemoteObject(this);
			var cells = evt.getProperty('cells');
			var ids = [];
			for(var i in cells){
				var cell = cells[i];
				ids.push({id:cell.id,edge:cell.edge});
			}
			
			ro.call(evt.name, {
				ids :ids
			});
		},
		
		onCellConnect:function(sender,evt){
			console.log(evt)
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