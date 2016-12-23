package example;

import java.util.ArrayList;
import java.util.UUID;

import org.eclipse.jface.layout.GridDataFactory;
import org.eclipse.jface.layout.GridLayoutFactory;
import org.eclipse.rap.rwt.application.AbstractEntryPoint;
import org.eclipse.swt.SWT;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.Listener;
import org.w3c.dom.Element;

import com.mxgraph.model.mxGraphModel;
import com.mxgraph.util.mxDomUtils;
import com.mxgraph.util.mxEventObject;
import com.mxgraph.util.mxUtils;
import com.mxgraph.util.mxEventSource.mxIEventListener;
import com.mxgraph.view.mxGraph;
import com.weadmin.mxgraph_rap.GraphJS;
import com.weadmin.mxgraph_rap.MxGraphJS.MxGraphEvent;

public class ExampleTwo extends AbstractEntryPoint{
	
	private Label hoverText;
	private int count = 100;
	
	String style1 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ffffff;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style2 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ffff00;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style3 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ff0000;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style4 = "text;html=1;resizable=0;points=[];align=center;verticalAlign=middle;labelBackgroundColor=#ffffff;";
	String style5 = "shape=image;html=1;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;verticalAlign=top;imageAspect=1;aspect=fixed;image=rwt-resources/graph/images/earth.png;strokeColor=#000000;fillColor=#FFFFFF;align=center;";
	
	private long tick = 0;
	private Display display;
	Label title;
	ArrayList<String> ids;
	
	private String getId(){
		return UUID.randomUUID().toString();
	}

	@Override
	protected void createContents(Composite parent) {
		parent.setLayout(new FillLayout());
		display = Display.getCurrent();
		Composite composite = new Composite(parent, SWT.NONE);
		GridLayoutFactory.fillDefaults().numColumns( 1 ).margins( 0, 0 ).applyTo( composite );
		
		Composite one = new Composite(composite, SWT.NONE);
		GridLayoutFactory.fillDefaults().numColumns( 6 ).extendedMargins(10, 0, 10, 5).applyTo( one );
		GridDataFactory.fillDefaults().align( SWT.FILL, SWT.FILL ).grab( true, false ).applyTo( one );
		
		Composite two = new Composite(composite, SWT.NONE);
		GridLayoutFactory.fillDefaults().numColumns( 6 ).margins( 0, 0 ).applyTo( two );
		GridDataFactory.fillDefaults().align( SWT.FILL, SWT.FILL ).grab( true, true ).applyTo( two );
		
		GraphJS g = new GraphJS(two, SWT.BORDER);
		//g.setBounds(20, 30, 800, 600);
	    GridDataFactory.fillDefaults().align( SWT.FILL, SWT.FILL ).span(6, 1).grab( true, true ).applyTo( g );
		
		Button button = new Button(one, SWT.PUSH);
		button.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		button.setText("树型");
		button.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				g.graghLayout("tree");
			}
		});
		
		Button button2 = new Button(one, SWT.PUSH);
		button2.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		button2.setText("圆型");
		button2.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				g.graghLayout("circle");
			}
		});
		
		Button button3 = new Button(one, SWT.PUSH);
		button3.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		button3.setText("堆型");
		button3.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				g.graghLayout("stack");
			}
		});
		
		Button button5 = new Button(one, SWT.PUSH);
		button5.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		button5.setText("随意");
		button5.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				g.graghLayout("fast");
			}
		});
		
		Button button6 = new Button(one, SWT.PUSH);
		button6.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		button6.setText("分层型");
		button6.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				g.graghLayout("hierarchical");
			}
		});
		
		Button button4 = new Button(one, SWT.PUSH);
		button4.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		button4.setText("分割型（慎点）");
		button4.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				g.graghLayout("partition");
			}
		});
		
		hoverText = new Label(g, SWT.BORDER);
		hoverText.setVisible(false);
		hoverText.setSize(100, 40);
		
		hoverText.setForeground(new Color(Display.getCurrent(), 255, 0, 0));
		mxGraph gd = new mxGraph();
		Object parentG = gd.getDefaultParent();
		g.setGraph(gd);
		
		try{
			g.loadGrapXml(mxUtils.readInputStream(this.getClass().getResourceAsStream("edge_label.xml")));
		}catch(Exception e){
			e.printStackTrace();
		}
		
		ids = new ArrayList<>();
//		gd.setConnectableEdges(false);
//		gd.setAllowDanglingEdges(false);
//		gd.setDisconnectOnMove(false);	
//		
//		
//		Object v1 = gd.insertVertex(gd.getDefaultParent(), getId(), "Hello", 20, 20, 160, 48,"box");
//		String iid =getId();
//		Object v2 = gd.insertVertex(gd.getDefaultParent(), iid, "World!", 200, 150, 120, 48);
//		Object e1 = gd.insertEdge(gd.getDefaultParent(), getId(), "", v1, v2);
		//g.setModel(gd.getModel());
//		
//
		Object v2=((mxGraphModel)gd.getModel()).getCell("3");
		
		g.addGraphListener(new mxIEventListener(){
			
			@Override
			public void invoke(Object sender, mxEventObject evt) {
				display.asyncExec(new Runnable() {
					
					@Override
					public void run() {
//						s.select(s.getItem(0));
						
					}
				});
				System.out.println("listener:"+evt.getName()+":"+evt.getProperties());
				
				if (evt.getName().equals(MxGraphEvent.MOUSE_DOWN)){
					double x = (double) evt.getProperty("x");
					double y = (double) evt.getProperty("y");
					int button = (int) evt.getProperty("button");
					if (button == 0){
						String id= getId();
						ids.add(id);
						System.out.println("id:"+ id);
						Element node = mxDomUtils.createDocument().createElement("UserObject");
						node.setAttribute("label", "node!");
						node.setAttribute("tooltip", "akkdkdkdkdk");
						node.setAttribute("placeholders", "1");
						
						Object v = gd.insertVertex(parentG,id, "node!", x, y, 80, 60, style5);
						g.setTooltip(id, "<h1>abcd</h1>"+ "<img src='rwt-resources/graph/images/warning.gif'/>");
						g.addCellOverlay(id, "rwt-resources/graph/images/warning.gif", 16, 16, "error");
						gd.insertEdge(parentG,getId(), "aaabbcc", v2, v);
						
					}else{
						//gd.insertEdge(gd.getDefaultParent(), getId(), "", v2, v);
						//g.setCellStyle("5", style3);	
						//g.translateCell("5", 5, 3);
						//String newStyle = mxStyleUtils.setStyle(style4, "rotation", "80");
						//g.setCellStyle("5", newStyle);
						//g.setCellChildOffset("4", 0, 258, 8);
						
						//g.updateEdgeLabelPosition("4",258,8,80);
						//g.selectCell(id);
						//g.selectCells(ids.toArray(new String[]{}) );
						//g.zoomOut();
						for(String id:ids){
							g.removeCellOverlays(id);
						}
					}
				}else if (evt.getName().equals(MxGraphEvent.MOUSE_HOVER)){
					double x = (double) evt.getProperty("x");
					double y = (double) evt.getProperty("y");
					String id = (String) evt.getProperty("id");
					hoverText.setText("aaaaaa");
					hoverText.pack();
					hoverText.setLocation((int)x, (int)y);
					
					hoverText.setVisible(true);
				}else if (evt.getName().equals(MxGraphEvent.MOUSE_LEAVE)){
					hoverText.setVisible(false);
				}
				
			}});
		
		g.addListener(SWT.MouseWheel, new Listener() {
			
			@Override
			public void handleEvent(Event event) {
				System.out.println(event);
				
			}
		});
		//g.setArrowOffset(0.8);
		//g.setTextAutoRotation(true);
	
		display = Display.getCurrent();
//		
//		final ServerPushSession pushSession = new ServerPushSession();
//		pushSession.start();
//		new Thread(new Runnable(){
//			
//			@Override
//			public void run() {
//				//Client client = RWT.getClient();
//				try {
//					Thread.sleep(2000);
//				} catch (InterruptedException e) {
//					// TODO Auto-generated catch block
//					e.printStackTrace();
//				}
//				while(true){
//					//UISession uiSession = RWT.getUISession( display );
//					display.asyncExec(new Runnable() {
//						
//						@Override
//						public void run() {
//							
//							long m = tick++ % 3;
//							System.out.println("timer..."+m);
//							if (m==0){
//								g.setCellStyle("5", style1);
//							}else if (m==1){
//								g.setCellStyle("5", style2);
//							}else if (m==2){
//								g.setCellStyle("5", style3);
//							}
//						}
//					});
//					try {
//						Thread.sleep(2000);
//					} catch (InterruptedException e) {
//						// TODO Auto-generated catch block
//						e.printStackTrace();
//					}
//				}
//			}
//		}).start();
	}

}
