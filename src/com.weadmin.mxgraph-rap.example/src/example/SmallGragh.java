package example;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.UUID;

import org.eclipse.jface.layout.GridDataFactory;
import org.eclipse.jface.layout.GridLayoutFactory;
import org.eclipse.rap.rwt.RWT;
import org.eclipse.rap.rwt.application.AbstractEntryPoint;
import org.eclipse.rap.rwt.client.service.JavaScriptExecutor;
import org.eclipse.swt.SWT;
import org.eclipse.swt.custom.ScrolledComposite;
import org.eclipse.swt.events.ControlEvent;
import org.eclipse.swt.events.ControlListener;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Label;

import com.mxgraph.model.mxGraphModel;
import com.mxgraph.util.mxEventObject;
import com.mxgraph.util.mxUtils;
import com.mxgraph.util.mxEventSource.mxIEventListener;
import com.mxgraph.view.mxGraph;
import com.weadmin.mxgraph_rap.GraphJS;

public class SmallGragh extends AbstractEntryPoint {

	private static final long serialVersionUID = 1L;

	String style1 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ffffff;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style2 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ffff00;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style3 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ff0000;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style4 = "text;html=1;resizable=0;points=[];align=center;verticalAlign=middle;labelBackgroundColor=#ffffff;";
	String style5 = "shape=image;html=1;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;verticalAlign=top;imageAspect=1;aspect=fixed;image=rwt-resources/graph/images/earth.png;strokeColor=#000000;fillColor=#FFFFFF;align=center;";

	private Display display;
	Label title;

	private String getId() {
		return UUID.randomUUID().toString();
	}

	@Override
	protected void createContents(Composite paren) {
		display = Display.getCurrent();

		GridLayoutFactory.fillDefaults().numColumns(1).margins(10, 10).applyTo(paren);
		GridDataFactory.fillDefaults().align(SWT.FILL, SWT.FILL).grab(true, true).applyTo(paren);
		Button button6 = new Button(paren, SWT.PUSH);
		button6.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		button6.setText("ÐÂ½¨ËõÂÔÍ¼");
		button6.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				JavaScriptExecutor executor = RWT.getClient().getService(JavaScriptExecutor.class);
				executor.execute("window.location.href='http://localhost:10010/hello2'");
			}
		});
		
		Composite parent = new Composite(paren, SWT.NONE);
		GridLayoutFactory.fillDefaults().numColumns(4).margins(0, 0).equalWidth(true).spacing(5, 5).applyTo(parent);
		
		File file = new File("D:/mxgragh");
		File[] farray = file.listFiles();
		for (File f : farray) {
			Composite composite = new Composite(parent, SWT.BORDER);
			GridLayoutFactory.fillDefaults().numColumns(1).margins(0, 0).applyTo(composite);
			GridDataFactory.fillDefaults().align(SWT.FILL, SWT.FILL).hint(468, 390).grab(true, true).applyTo(composite);

			Composite one = new Composite(composite, SWT.NONE);
			GridLayoutFactory.fillDefaults().numColumns(5).extendedMargins(10, 10, 10, 5).equalWidth(true).applyTo(one);
			GridDataFactory.fillDefaults().align(SWT.FILL, SWT.FILL).grab(true, false).applyTo(one);

			Composite two = new Composite(composite, SWT.NONE);
			GridLayoutFactory.fillDefaults().numColumns(1).margins(0, 0).applyTo(two);
			GridDataFactory.fillDefaults().align(SWT.FILL, SWT.FILL).grab(true, true).applyTo(two);
			two.setBackground(two.getDisplay().getSystemColor(SWT.COLOR_GREEN));
			
			GraphJS g = new GraphJS(two, SWT.NONE);
			GridDataFactory.fillDefaults().align(SWT.FILL, SWT.FILL).grab(true, true).applyTo(g);
			
			Button zoomIn = new Button(one, SWT.PUSH);
			zoomIn.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
			zoomIn.setText("zoomIn(+)");
			zoomIn.addSelectionListener(new SelectionAdapter() {
				@Override
				public void widgetSelected(SelectionEvent e) {
					g.zoomIn();
				}
			});

			Button zoomOut = new Button(one, SWT.PUSH);
			zoomOut.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
			zoomOut.setText("zoomOut(-)");
			zoomOut.addSelectionListener(new SelectionAdapter() {
				@Override
				public void widgetSelected(SelectionEvent e) {
					g.zoomOut();
				}
			});
			
			Button showArea = new Button(one, SWT.PUSH);
			showArea.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, false, false));
			showArea.setText("Òþ²Ø");
			showArea.setData("show", true);
			showArea.addSelectionListener(new SelectionAdapter() {
				@Override
				public void widgetSelected(SelectionEvent e) {
					boolean area = (boolean) showArea.getData("show");
					if (area) {
						showArea.setText("ÏÔÊ¾");
						showArea.setData("show", false);
						g.setControlarea("none");
					}else{
						showArea.setText("Òþ²Ø");
						showArea.setData("show", true);
						g.setControlarea("block");
					}
				}
			});

			Button buttond = new Button(one, SWT.PUSH);
			buttond.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
			buttond.setText("É¾³ý");
			buttond.addSelectionListener(new SelectionAdapter() {
				@Override
				public void widgetSelected(SelectionEvent e) {
					File file = new File("D:/mxgragh/" + f.getName());
					file.delete();
					JavaScriptExecutor executor = RWT.getClient().getService(JavaScriptExecutor.class);
					executor.execute("window.location.href='http://localhost:10010/small'");
				}
			});

			Button finish = new Button(one, SWT.PUSH);
			finish.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
			finish.setText("±à¼­");
			finish.addSelectionListener(new SelectionAdapter() {
				@Override
				public void widgetSelected(SelectionEvent e) {
					JavaScriptExecutor executor = RWT.getClient().getService(JavaScriptExecutor.class);
					executor.execute(
							"window.location.href='http://localhost:10010/hello2?filename=" + f.getName() + "'");
				}
			});
			mxGraph gd = new mxGraph();
			g.setGraph(gd);

			try {
				InputStream in = new FileInputStream(new File("D:/mxgragh/" + f.getName()));
				g.loadGrapXml(mxUtils.readInputStream(in));
			} catch (Exception e) {
				e.printStackTrace();
			}

			g.addGraphListener(new mxIEventListener() {

				@Override
				public void invoke(Object sender, mxEventObject evt) {
					display.asyncExec(new Runnable() {

						@Override
						public void run() {

						}
					});
					if (evt.getName().equals("OpenGragh")) {
						boolean open = (boolean) evt.getProperty("OpenGragh");
						if (open) {
							JavaScriptExecutor executor = RWT.getClient().getService(JavaScriptExecutor.class);
							executor.execute("window.location.href='http://localhost:10010/hello2?filename=" + f.getName() + "'");
						}
					}
				}
			});
			g.addControlListener(new ControlListener() {
				
				@Override
				public void controlResized(ControlEvent e) {
					// TODO Auto-generated method stub
					
				}
				
				@Override
				public void controlMoved(ControlEvent e) {
					System.out.println(g.getSize());
					
				}
			});
			g.setPageType("small");
		}
	}

}
