package example;

import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;
import java.util.UUID;

import org.eclipse.rap.rwt.RWT;
import org.eclipse.rap.rwt.application.AbstractEntryPoint;
import org.eclipse.rap.rwt.client.Client;
import org.eclipse.rap.rwt.internal.service.ServiceContext;
import org.eclipse.rap.rwt.service.ServerPushSession;
import org.eclipse.rap.rwt.service.UISession;
import org.eclipse.swt.SWT;
import org.eclipse.swt.events.MouseEvent;
import org.eclipse.swt.events.MouseListener;
import org.eclipse.swt.events.TraverseEvent;
import org.eclipse.swt.events.TraverseListener;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.List;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.Text;
import org.eclipse.swt.widgets.Tree;
import org.eclipse.swt.widgets.TreeItem;
import org.w3c.dom.Element;

import com.mxgraph.util.mxDomUtils;
import com.mxgraph.util.mxEventObject;
import com.mxgraph.util.mxUtils;
import com.mxgraph.util.mxXmlUtils;
import com.mxgraph.util.mxEventSource.mxIEventListener;
import com.mxgraph.util.mxStyleUtils;
import com.mxgraph.view.mxGraph;
import com.weadmin.mxgraph_rap.GraphJS;
import com.weadmin.mxgraph_rap.MxGraphJS;
import com.weadmin.mxgraph_rap.MxGraphJS.MxGraphEvent;

public class ExampleTwo extends AbstractEntryPoint{
	
	private Label hoverText;
	private int count = 100;
	
	String style1 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ffffff;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style2 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ffff00;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style3 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ff0000;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style4 = "text;html=1;resizable=0;points=[];align=center;verticalAlign=middle;labelBackgroundColor=#ffffff;";
	
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
		
//		Tree s = new Tree(parent, SWT.BORDER);
//		s.setBounds(820, 20, 400, 600);
//		
//		TreeItem treeItem= new TreeItem(s, SWT.NONE);
//		treeItem.setText(0, "aaaaaaa");
//		
//		TreeItem treeItem2 = new TreeItem(s, SWT.NONE);
//		treeItem2.setText(0, "bbbbbbb");
		
		GraphJS g = new GraphJS(parent, SWT.BORDER);
		g.setBounds(20, 30, 800, 600);
		hoverText = new Label(g, SWT.BORDER);
		hoverText.setVisible(false);
		hoverText.setSize(100, 40);
		
		hoverText.setForeground(new Color(Display.getCurrent(), 255, 0, 0));
		mxGraph gd = new mxGraph();
		g.setGraph(gd);
		
		try{
			g.loadGrapXml(mxUtils.readFile("D:\\Documents\\Downloads\\edge_label.xml"));
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
						
						Object v = gd.insertVertex(gd.getDefaultParent(),id, "node!", x, y, 80, 60, style2);
						g.setTooltip(id, "<h1>aaaaaaaaaaaaaaaa</h1>");
						//gd.insertEdge(gd.getDefaultParent(),getId(), "", v2, v);
						

					}else{
						//gd.insertEdge(gd.getDefaultParent(), getId(), "", v2, v);
						//g.setCellStyle("5", style3);	
						//g.translateCell("5", 5, 3);
						//String newStyle = mxStyleUtils.setStyle(style4, "rotation", "80");
						//g.setCellStyle("5", newStyle);
						//g.setCellChildOffset("4", 0, 258, 8);
						
						//g.updateEdgeLabelPosition("4",258,8,80);
						//g.selectCell(id);
						g.selectCells(ids.toArray(new String[]{}) );
						//g.zoomOut();
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
		g.setArrowOffset(0.3);
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
