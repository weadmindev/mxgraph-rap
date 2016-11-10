var MXGRAPH_BASEPATH = "rwt-resources/mxgraph/";

(function() {
	'use strict';


	rap.registerTypeHandler("eclipsesource.mxgraph", {

		factory : function(properties) {
			return new eclipsesource.mxgraph(properties);
		},

		destructor : "destroy",
		methods : [ 'insertVertex', 'insertEdge','appendXmlModel','removeCells','putCellStyle'],
		properties : [ "size", "xmlModel","prop"],
		events:['modelUpdate']

	});

	if (!window.eclipsesource) {
		window.eclipsesource = {};
	}

	eclipsesource.mxgraph = function(properties) {
		console.log("mxgraph....." + properties)
		bindAll(this, [ "layout", "onReady", "onSend", "onRender" ,"onConnect","mouseHover","autoSave"]);
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
		
		this._graph = new mxGraph(this.element);
		this._parent = null;
		this._xmlModel = null;
		this._hoverCell = null;
		
		this._graph.setAllowDanglingEdges(false);
		this._graph.setDisconnectOnMove(false);
		this._graph.setConnectable(true);
		
		var keyHandler = new mxKeyHandler(this._graph);
		keyHandler.bindKey(46, function(evt)
		{
			console.log('bindKey')
			if (graph.isEnabled())
			{
				graph.removeCells();
			}
		 });	
		

		rap.on("render", this.onRender);
	};

	eclipsesource.mxgraph.prototype = {

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
			console.log("mxgraph...onReady..")

		},

		onRender : function() {
			if (this.element.parentNode) {
				rap.off("render", this.onRender);

				// Creates the graph inside the given container

				var graph = this._graph;
				//var highlight = new mxCellTracker(graph, '#00FF00');//, this.mouseHover);
				
				// Enables rubberband selection
				//new mxRubberband(graph);

//				var style = new Object();
//				style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
//				style[mxConstants.STYLE_PERIMETER] = mxPerimeter.EllipsePerimeter;//mxPerimeter.RectanglePerimeter;
//				style[mxConstants.STYLE_IMAGE] = MXGRAPH_BASEPATH + 'images/earth.png';
//				style[mxConstants.STYLE_FONTCOLOR] = '#000000';
//				graph.getStylesheet().putCellStyle('image', style);
//
//				style = mxUtils.clone(style);
//				style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
//				style[mxConstants.STYLE_STROKECOLOR] = '#000000';
//				style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
//				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
//				style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_CENTER;
//				style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
//				style[mxConstants.STYLE_IMAGE] = MXGRAPH_BASEPATH
//						+ 'images/earth.png';
//				style[mxConstants.STYLE_IMAGE_WIDTH] = 48;
//				style[mxConstants.STYLE_IMAGE_HEIGHT] = 48;
//				style[mxConstants.STYLE_SPACING_TOP] = 56;
//				style[mxConstants.STYLE_SPACING] = 8;
//				graph.getStylesheet().putCellStyle('node', style);
//
//				style = mxUtils.clone(style);
//				style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_LABEL;
//				style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_BOTTOM;
//				style[mxConstants.STYLE_IMAGE] = MXGRAPH_BASEPATH
//						+ 'images/server.png';
//				delete style[mxConstants.STYLE_SPACING_TOP];
//				graph.getStylesheet().putCellStyle('top', style);
//
//				style = mxUtils.clone(style);
//				delete style[mxConstants.STYLE_SPACING_TOP];
//				style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
//				style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_LEFT;
//				style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
//				style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
//				style[mxConstants.STYLE_IMAGE] = MXGRAPH_BASEPATH + 'images/mail_find.svg';
//				style[mxConstants.STYLE_SPACING_LEFT] = 60;
//				style[mxConstants.STYLE_SPACING] = 8;
//				graph.getStylesheet().putCellStyle('box', style);

//				style = mxUtils.clone(style);
//				style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_RIGHT;
//				style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_RIGHT;
//				delete style[mxConstants.STYLE_SPACING_LEFT];
//				style[mxConstants.STYLE_SPACING_RIGHT] = 55;
//				graph.getStylesheet().putCellStyle('left', style);

				graph.addMouseListener(this);
				// Gets the default parent for inserting new cells. This
				// is normally the first child of the root (ie. layer 0).

				// // Adds cells to the model in a single step
				graph.getModel().beginUpdate();
				try {
					// var v1 = graph.insertVertex(parent, null, 'Hello,', 20,
					// 20, 160, 48,'right');
					// var v2 = graph.insertVertex(parent, null, 'World!', 200,
					// 150, 120, 48);
					// var e1 = graph.insertEdge(parent, null, '', v1, v2);

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
				g.addListener(mxEvent.CELLS_MOVED,this.onRemove);
				var mgr = new mxAutoSaveManager(graph);
				mgr.save = this.autoSave;
				
				

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
			//console.log("mxgraph...onSend..")
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
		onRemove:function(sender,evt){
			console.log("onRemove:"+evt)
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
			console.log("mxgraph...layout..")
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