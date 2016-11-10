package com.weadmin.mxgraph_rap;

import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.eclipse.rap.json.JsonArray;
import org.eclipse.rap.json.JsonObject;
import org.eclipse.rap.json.JsonValue;
import org.eclipse.swt.SWT;
import org.eclipse.swt.events.KeyEvent;
import org.eclipse.swt.events.KeyListener;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.events.SelectionListener;
import org.eclipse.swt.graphics.Point;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.Menu;
import org.eclipse.swt.widgets.MenuItem;
import org.w3c.dom.Document;
import org.w3c.dom.Node;

import com.mxgraph.io.mxCodec;
import com.mxgraph.model.mxCell;
import com.mxgraph.model.mxGraphModel;
import com.mxgraph.model.mxIGraphModel;
import com.mxgraph.util.mxEvent;
import com.mxgraph.util.mxEventObject;
import com.mxgraph.util.mxEventSource.mxIEventListener;
import com.mxgraph.util.mxUtils;
import com.mxgraph.util.mxXmlUtils;
import com.mxgraph.view.mxGraph;


public class GraphJS extends SVWidgetBase{
	
	public static class MxGraphEvent{
		public static String MOUSE_DOWN = "onMouseDown";
		public static String NODE_SELECT = "onNodeSelect";
		public static String EDGE_SELECT = "onEdgeSelect";
		public static String EDGE_Connect = "onConnect";
		public static String MOUSE_HOVER = "onMouseHover";
		public static String MOUSE_LEAVE = "onMouseLeave";
		public static String CELL_REMOVE = "onCellRemove";
	};

	private List<mxIEventListener>  graphListeners;

	Menu menu;
	private mxGraph graph;
	private boolean enableMenu;
	

	
	public GraphJS(Composite parent, int style) {
		super(parent, style);
		
		enableMenu = true;
		
		menu = new Menu(this.getParent());
		
		MenuItem mi = new MenuItem(menu, SWT.NONE);
		mi.setText("Delete");
		mi.addSelectionListener(new SelectionListener() {
			
			@Override
			public void widgetSelected(SelectionEvent e) {
				removeCells();
				
			}
			
			@Override
			public void widgetDefaultSelected(SelectionEvent e) {
				// TODO Auto-generated method stub
				
			}
		});
		//this.setMenu(menu);
		
		graphListeners = new Vector<>();
		
		this.addKeyListener(new KeyListener() {
			
			@Override
			public void keyReleased(KeyEvent e) {
				// TODO Auto-generated method stub
				
			}
			
			@Override
			public void keyPressed(KeyEvent e) {
				if (e.keyCode == SWT.DEL){
					removeCells();
				}
				
			}
		});

		this.addGraphListener(new mxIEventListener() {
			
			@Override
			public void invoke(Object sender, mxEventObject evt) {
				if (evt.getName().equals(MxGraphEvent.NODE_SELECT)||evt.getName().equals(MxGraphEvent.EDGE_SELECT)){
					double x = (double) evt.getProperty("x");
					double y = (double) evt.getProperty("y");
					int button = (int) evt.getProperty("button");
					Point pt = toDisplay((int)x, (int)y);
					
					System.out.println(evt.getName());
					if (button==2){
						menu.setLocation(pt);
						menu.setVisible(true);
					}
				}
				
			}
		});
	}
	
	public void setGraph(mxGraph g){
		this.graph = g;
		
		g.addListener(mxEvent.ADD_CELLS,new mxIEventListener() {
			
			@Override
			public void invoke(Object sender, mxEventObject evt) {
				System.out.println("event:"+evt.getName());
				evt.consume();
				Object cell = evt.getProperty("cells");
				if (cell != null){
					appendToModel(cell);
				}
			}
		});
		g.addPropertyChangeListener(new PropertyChangeListener() {
			
			@Override
			public void propertyChange(PropertyChangeEvent evt) {
				Object v = evt.getNewValue();
				JsonObject obj = new JsonObject();
				obj.add("name", evt.getPropertyName());
				
				if (v instanceof Boolean)
					obj.add("value", (Boolean)v);
				else if  (v instanceof Double)
					obj.add("value", (Double)v);
				else if  (v instanceof Integer)
					obj.add("value",  (Integer)v);
				else if  (v instanceof String)
					obj.add("value",  (String)v);
				else if  (v instanceof Long)
					obj.add("value",  (Long)v);
				
				setRemoteProp("prop", obj);
				mxCell cell;
				
			}
		});
		
	}

	@Override
	protected void handleSetProp(JsonObject properties) {
		JsonValue model = properties.get( "model" );
	      if( model != null ) {
	        String content = model.asString();
	        //System.out.println("handleSetProp:" +content);
	        
	        Document doc = mxXmlUtils.parseXml(content);
	        mxCodec codec = new mxCodec(doc);
	        codec.decode(doc.getDocumentElement(), graph.getModel());
	        //System.out.println("after set:"+getGraphXml());
	      }
	}

	@Override
	protected void handleCallMethod(String method, JsonObject parameters) {
		
		if (method.equals(MxGraphEvent.MOUSE_DOWN)||method.equals(MxGraphEvent.NODE_SELECT)
				||method.equals(MxGraphEvent.EDGE_SELECT)||method.equals(MxGraphEvent.MOUSE_HOVER)
				||method.equals(MxGraphEvent.MOUSE_LEAVE)){
			double x = parameters.get("x").asDouble();
			double y = parameters.get("y").asDouble();
			int b =parameters.get("button").asInt();
			mxEventObject event = new mxEventObject(method,"x",x,"y",y,"button",b);
			if (parameters.get("id")!=null){
				event.getProperties().put("id", parameters.get("id").asString());
			}
			if (parameters.get("edge")!=null&&parameters.get("edge").isBoolean()){
				event.getProperties().put("edge", parameters.get("edge").asBoolean());
			}
			for (mxIEventListener l:graphListeners){
				l.invoke(this, event);
			}
		}
		
		if (method.equals(MxGraphEvent.EDGE_Connect)){
			String source = parameters.get("source").asString();
			String target = parameters.get("target").asString();

			mxEventObject event = new mxEventObject(method,"source",source,"target",target);
			for (mxIEventListener l:graphListeners){
				l.invoke(this, event);
			}
		}
		if (method.equals(MxGraphEvent.CELL_REMOVE)){
			JsonArray ids = parameters.get("ids").asArray();

			mxEventObject event = new mxEventObject(method,"id",ids);
			for (mxIEventListener l:graphListeners){
				l.invoke(this, event);
			}
		}

		
		if (method.equals("modelUpdate")){
			String cells = parameters.get("cells").asString();
			appendModel(cells);
			//System.out.println("after update:"+getGraphXml());
		}
		
	}
	
	@Override
	protected void handleCallNotify(String event, JsonObject parameters) {
		System.out.println("handleCallNotify:"+event);
	}
	
	public void addGraphListener(mxIEventListener l){
		graphListeners.add(l);
	}


	@Override
	protected String getWidgetName() {
		return "graph";
	}

	@Override
	protected ArrayList<CustomRes> getCustomRes() {
		ArrayList<CustomRes> res = new ArrayList<>();
		res.add(new CustomRes("stencils/cisco/routers.xml", false, false));
		res.add(new CustomRes("stencils/cisco/switches.xml", false, false));
		res.add(new CustomRes("stencils/cisco/servers.xml", false, false));
		res.add(new CustomRes("stencils/cisco/wireless.xml", false, false));
		res.add(new CustomRes("stencils/cisco/storage.xml", false, false));
		res.add(new CustomRes("stencils/cisco/security.xml", false, false));
		
		res.add(new CustomRes("resources/graph.txt", false, false));
		res.add(new CustomRes("resources/graph_zh.txt", false, false));
		res.add(new CustomRes("resources/editor.txt", false, false));
		res.add(new CustomRes("resources/editor_zh.txt", false, false));
		res.add(new CustomRes("images/earth.png", false, false));
		res.add(new CustomRes("images/window.gif", false, false));
		res.add(new CustomRes("images/window-title.gif", false, false));
		res.add(new CustomRes("images/button.gif", false, false));
		res.add(new CustomRes("images/close.gif", false, false));
		res.add(new CustomRes("images/maximize.gif", false, false));
		res.add(new CustomRes("images/minimize.gif", false, false));
		res.add(new CustomRes("images/mail_find.svg", false, false));
		res.add(new CustomRes("images/resize.gif", false, false));
		res.add(new CustomRes("css/common.css", true, true));
		res.add(new CustomRes("css/explorer.css", true, true));
		res.add(new CustomRes("add_path_graph.js", true, false));
		res.add(new CustomRes("sanitizer.min.js", true, false));
		res.add(new CustomRes("mxClient.js", true, false));
		res.add(new CustomRes("Graph.js", true, false));
		res.add(new CustomRes("Shapes.js", true, false));
		res.add(new CustomRes("handler_graph.js", true, false));
		return res;
	}
	
	public void setModel(mxIGraphModel mxIGraphModel){
		mxCodec codec = new mxCodec();
		Node node = codec.encode(mxIGraphModel);
		
		String xmlText = mxUtils.getPrettyXml(node);
		//System.out.println(mxUtils.getPrettyXml(node));
		super.setRemoteProp("xmlModel", xmlText);
	}
	
	
	private void appendToModel(Object objs){
		List<Object> cells = new Vector<>();
		if (objs instanceof Object[]){
			for(Object ob: (Object[])objs){
				cells.add(ob);//(Arrays.asList(objs));
			}
			
		}else{
			cells.add(objs);
		}
		for(Object cell:cells){
			mxCodec codec = new mxCodec();
			Node node = codec.encode(cell);
			String xmlText = mxXmlUtils.getXml(node);
			//System.out.println(xmlText);
			JsonObject obj = new JsonObject();
			obj.set("content", xmlText);
			super.callRemoteMethod("appendXmlModel", obj);
		}
	}
	
	public void insertVertex(String id, String value,double x,double y,double width,double height,String shape){
		JsonObject obj = new JsonObject();
		obj.set("id", id);
		obj.set("value", value);
		obj.set("x", x);
		obj.set("y", y);
		obj.set("width", width);
		obj.set("height", height);
		if (shape!=null)
			obj.set("shape", shape);
		super.callRemoteMethod("insertVertex", obj);
	}
	
	public void insertEdge(String id,String value,String source,String target){
		JsonObject obj = new JsonObject();
		obj.set("id", id);
		obj.set("value", value);
		obj.set("source", source);
		obj.set("target", target);
		super.callRemoteMethod("insertEdge", obj);
	}
	
	public void putCellStyle(Map<String,Object> styleMap){
		JsonObject obj = new JsonObject();
		
		for(String k:styleMap.keySet()){
			Object v = styleMap.get(k);
			if (v instanceof Boolean)
				obj.add(k, (Boolean)v);
			else if  (v instanceof Double)
				obj.add(k, (Double)v);
			else if  (v instanceof Integer)
				obj.add(k, (Integer)v);
			else if  (v instanceof String)
				obj.add(k, (String)v);
			else if  (v instanceof Long)
				obj.add(k, (Long)v);
			
		}
	}
	
	public String getGraphXml(){
		mxCodec codec = new mxCodec();
		Node node = codec.encode(graph.getModel());
		String xmlText = mxUtils.getPrettyXml(node);
		return xmlText;
	}
	

	public void loadGrapXml(String xml){
        Document doc = mxXmlUtils.parseXml(xml);
        mxCodec codec = new mxCodec(doc);
        codec.decode(doc.getDocumentElement(), graph.getModel());
        this.setModel(graph.getModel());
	}
	
	
	
	private void appendModel(String cell){
		Document doc = mxXmlUtils.parseXml(cell);
		mxCodec codec = new mxCodec(doc){

			@Override
			public Object lookup(String id) {
				mxGraphModel model = (mxGraphModel) graph.getModel();
				return model.getCell(id);
			}};

		Object n = codec.decode(doc.getDocumentElement());
		((mxCell)n).setParent(null);
		System.out.println("appendModel:"+n);
		graph.getModel().beginUpdate();
		Object[] cells = new Object[]{n};
		try {
			graph.addCells(cells);
		} finally {
			// Updates the display
			graph.getModel().endUpdate();
		}
	}
	
	private void removeCells(){
		super.callRemoteMethod("removeCells", new JsonObject());
	}
}
