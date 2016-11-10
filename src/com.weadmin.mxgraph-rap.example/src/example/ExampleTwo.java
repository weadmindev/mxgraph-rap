package example;

import java.util.UUID;

import org.eclipse.rap.rwt.application.AbstractEntryPoint;
import org.eclipse.swt.SWT;
import org.eclipse.swt.events.MouseEvent;
import org.eclipse.swt.events.MouseListener;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.List;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.Text;

import com.mxgraph.util.mxEventObject;
import com.mxgraph.util.mxUtils;
import com.mxgraph.util.mxEventSource.mxIEventListener;
import com.mxgraph.view.mxGraph;
import com.weadmin.mxgraph_rap.GraphJS;
import com.weadmin.mxgraph_rap.MxGraphJS;
import com.weadmin.mxgraph_rap.MxGraphJS.MxGraphEvent;

public class ExampleTwo extends AbstractEntryPoint{
	
	private Label hoverText;
	private int count = 100;
	
	private String getId(){
		return UUID.randomUUID().toString();
	}

	@Override
	protected void createContents(Composite parent) {
		parent.setLayout(null);//new FillLayout());
		
		GraphJS g = new GraphJS(parent, SWT.BORDER);
		g.setBounds(20, 30, 800, 600);
		hoverText = new Label(g, SWT.BORDER);
		hoverText.setVisible(false);
		hoverText.setSize(100, 40);
		
		hoverText.setForeground(new Color(Display.getCurrent(), 255, 0, 0));
		mxGraph gd = new mxGraph();
		g.setGraph(gd);
		
		try{
			g.loadGrapXml(mxUtils.readFile("D:\\Documents\\Downloads\\network_1.xml"));
		}catch(Exception e){
			e.printStackTrace();
		}
//		gd.setConnectableEdges(false);
//		gd.setAllowDanglingEdges(false);
//		gd.setDisconnectOnMove(false);	
//		
//		
//		Object v1 = gd.insertVertex(gd.getDefaultParent(), getId(), "Hello", 20, 20, 160, 48,"box");
//		String iid =getId();
//		Object v2 = gd.insertVertex(gd.getDefaultParent(), iid, "World!", 200, 150, 120, 48);
//		Object e1 = gd.insertEdge(gd.getDefaultParent(), getId(), "", v1, v2);
//		g.setModel(gd.getModel());
//		
//
		g.addGraphListener(new mxIEventListener(){
			
			@Override
			public void invoke(Object sender, mxEventObject evt) {
				System.out.println("listener:"+evt.getName());
				
				if (evt.getName().equals(MxGraphEvent.MOUSE_DOWN)){
					double x = (double) evt.getProperty("x");
					double y = (double) evt.getProperty("y");
					int button = (int) evt.getProperty("button");
					if (button == 0){
						String id = getId();
						System.out.println("id:"+ id);
						Object v = gd.insertVertex(gd.getDefaultParent(),id, "node!", x, y, 80, 60, "node");
						//gd.insertEdge(gd.getDefaultParent(),getId(), "", v2, v);

					}else{
						//gd.insertEdge(gd.getDefaultParent(), getId(), "", v2, v);
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
		
		
	}

}
