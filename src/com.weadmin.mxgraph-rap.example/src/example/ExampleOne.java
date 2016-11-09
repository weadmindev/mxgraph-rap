package example;

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
import com.mxgraph.util.mxEventSource.mxIEventListener;
import com.mxgraph.view.mxGraph;
import com.weadmin.mxgraph_rap.MxGraphJS;
import com.weadmin.mxgraph_rap.MxGraphJS.MxGraphEvent;

public class ExampleOne extends AbstractEntryPoint{
	
	private Label hoverText;

	@Override
	protected void createContents(Composite parent) {
		parent.setLayout(null);//new FillLayout());
		
		MxGraphJS g = new MxGraphJS(parent, SWT.BORDER);
		g.setBounds(20, 30, 800, 600);
		hoverText = new Label(g, SWT.BORDER);
		hoverText.setVisible(false);
		hoverText.setSize(100, 40);
		
		hoverText.setForeground(new Color(Display.getCurrent(), 255, 0, 0));
		mxGraph gd = new mxGraph();
		g.setGraph(gd);
		//gd.setConnectableEdges(false);
		//gd.setAllowDanglingEdges(true);
//		gd.setDisconnectOnMove(true);
		
		Object v1 = gd.insertVertex(gd.getDefaultParent(), null, "Hello", 20, 20, 160, 48,"box");
		Object v2 = gd.insertVertex(gd.getDefaultParent(), null, "World!", 200, 150, 120, 48);
		Object e1 = gd.insertEdge(gd.getDefaultParent(), null, "", v1, v2);
		g.setModel(gd.getModel());
		

		g.addGraphListener(new mxIEventListener(){
			Object v;
			@Override
			public void invoke(Object sender, mxEventObject evt) {
				System.out.println("listener:"+evt.getName());
				
				if (evt.getName().equals(MxGraphEvent.MOUSE_DOWN)){
					double x = (double) evt.getProperty("x");
					double y = (double) evt.getProperty("y");
					int button = (int) evt.getProperty("button");
					if (button == 0){
						 v= gd.insertVertex(gd.getDefaultParent(), null, "node!", x, y, 80, 60, "node");
						 gd.insertEdge(gd.getDefaultParent(), null, "", v2, v);

					}else{
						gd.insertEdge(gd.getDefaultParent(), null, "", v2, v);
					}
				}else if (evt.getName().equals(MxGraphEvent.MOUSE_HOVER)){
					double x = (double) evt.getProperty("x");
					double y = (double) evt.getProperty("y");
					String id = (String) evt.getProperty("id");
					hoverText.setText(id);
			
					hoverText.setLocation((int)x, (int)y);
					
					hoverText.setVisible(true);
				}else if (evt.getName().equals(MxGraphEvent.MOUSE_LEAVE)){
					hoverText.setVisible(false);
				}
				
			}});
		
		
	}

}
