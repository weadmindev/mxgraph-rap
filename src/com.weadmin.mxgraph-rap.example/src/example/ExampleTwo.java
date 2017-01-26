package example;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.UUID;
import org.eclipse.jface.layout.GridDataFactory;
import org.eclipse.jface.layout.GridLayoutFactory;
import org.eclipse.rap.json.JsonArray;
import org.eclipse.rap.json.JsonObject;
import org.eclipse.rap.rwt.RWT;
import org.eclipse.rap.rwt.application.AbstractEntryPoint;
import org.eclipse.rap.rwt.client.service.JavaScriptExecutor;
import org.eclipse.rap.rwt.client.service.StartupParameters;
import org.eclipse.swt.SWT;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.events.SelectionListener;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.graphics.Font;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Combo;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.Menu;
import org.eclipse.swt.widgets.MenuItem;
import org.eclipse.swt.widgets.Shell;
import com.mxgraph.model.mxGraphModel;
import com.mxgraph.util.mxEventObject;
import com.mxgraph.util.mxUtils;
import com.mxgraph.util.mxEventSource.mxIEventListener;
import com.mxgraph.view.mxGraph;
import com.weadmin.mxgraph_rap.GraphJS;
import com.weadmin.mxgraph_rap.MxGraphJS.MxGraphEvent;

public class ExampleTwo extends AbstractEntryPoint{

	private static final long serialVersionUID = 1L;

	String style1 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ffffff;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style2 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ffff00;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style3 = "shape=mxgraph.cisco.switches.multi-fabric_server_switch;html=1;dashed=0;fillColor=#036897;strokeColor=#ff0000;strokeWidth=2;verticalLabelPosition=bottom;verticalAlign=top";
	String style4 = "strokeColor=#228B22;dashed=0;targetPerimeterSpacing=-6;sourcePerimeterSpacing=-6;";
	String style5 = "shape=image;html=1;verticalLabelPosition=bottom;labelBackgroundColor=none;verticalAlign=top;imageAspect=1;aspect=fixed;image=rwt-resources/graph/images/application.png;strokeColor=#000000;fillColor=#FFFFFF;align=center;resourceLevel=3;";
	String style6 = "shape=image;html=1;verticalLabelPosition=bottom;labelBackgroundColor=none;verticalAlign=top;imageAspect=1;aspect=fixed;image=rwt-resources/graph/images/server.png;strokeColor=#000000;fillColor=#FFFFFF;align=center;resourceLevel=2;";
	String style7 = "text;html=1;resizable=0;points=[];align=center;verticalAlign=middle;labelBackgroundColor=none;rotation=45;";

	private Label hoverText;
	private Display display;
	private static Shell shell;
	private String filename;
	Label title;
	String lastids;
	ArrayList<String> ids;
	static ArrayList<String> edgeids;
	ArrayList<String> testxml;

	private String getId(){
		return UUID.randomUUID().toString();
	}
	

	@Override
	protected void createContents(Composite parent) {
		parent.setLayout(new FillLayout());
		display = Display.getCurrent();
		testxml = new ArrayList<String>();
		StartupParameters service = RWT.getClient().getService(StartupParameters.class);
		filename = service.getParameter("filename");
		
		Composite composite = new Composite(parent, SWT.NONE);
		GridLayoutFactory.fillDefaults().numColumns( 1 ).margins( 0, 0 ).applyTo( composite );

		Composite one = new Composite(composite, SWT.NONE);
		GridLayoutFactory.fillDefaults().numColumns( 14 ).extendedMargins(10, 0, 10, 5).applyTo( one );
		GridDataFactory.fillDefaults().align( SWT.FILL, SWT.FILL ).grab( true, false ).applyTo( one );

		Composite two = new Composite(composite, SWT.NONE);
		GridLayoutFactory.fillDefaults().numColumns( 9 ).margins( 0, 0 ).applyTo( two );
		GridDataFactory.fillDefaults().align( SWT.FILL, SWT.FILL ).grab( true, true ).applyTo( two );

		GraphJS g = new GraphJS(two, SWT.BORDER);
		shell = new Shell(g.getDisplay());
		//g.setBounds(20, 30, 800, 600);
	    GridDataFactory.fillDefaults().align( SWT.FILL, SWT.FILL ).span(9, 1).grab( true, true ).applyTo( g );

	    Button create = new Button(one, SWT.PUSH);
		create.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		create.setText("新建");
		create.setBackground(new Color(create.getDisplay(), 35, 130, 114));
		create.setForeground(create.getDisplay().getSystemColor(SWT.COLOR_WHITE));
		create.setFont(new Font(create.getDisplay(), "楷体",17,SWT.NORMAL));
		create.addSelectionListener(new SelectionAdapter() {
			private static final long serialVersionUID = 1L;
			@Override
			public void widgetSelected(SelectionEvent e) {
				JavaScriptExecutor executor = RWT.getClient().getService(JavaScriptExecutor.class);
				executor.execute("window.location.href='http://localhost:10010/hello2'");
			}
		});

	    Combo layout = new Combo(one, SWT.DROP_DOWN);
		layout.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, false, false));
		layout.setItems(new String[]{"树型","圆型","堆型","随意","分层类型"});
		layout.setText("选择布局");
		layout.addSelectionListener(new SelectionListener() {
			private static final long serialVersionUID = 1L;
			@Override
			public void widgetSelected(SelectionEvent e) {
				int index = layout.getSelectionIndex();
				switch (index) {
				case 0:
					g.graphLayout("tree");
					break;
				case 1:
					g.graphLayout("circle");
					break;
				case 2:
					g.graphLayout("stack");
					break;
				case 3:
					g.graphLayout("fast");
					break;
				case 4:
					g.graphLayout("hierarchical");
					break;
				case 5:
					g.graphLayout("partition");
					break;
				default:
					break;
				}
			}
			@Override
			public void widgetDefaultSelected(SelectionEvent e) {
			}
		});

		Button zoomIn = new Button(one, SWT.PUSH);
		zoomIn.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		zoomIn.setText("放大");
		zoomIn.addSelectionListener(new SelectionAdapter() {
			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				g.zoomIn();
			}
		});

		Button zoomOut = new Button(one, SWT.PUSH);
		zoomOut.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		zoomOut.setText("缩小");
		zoomOut.addSelectionListener(new SelectionAdapter() {
			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				g.zoomOut();
			}
		});

		Button zoomActual = new Button(one, SWT.PUSH);
		zoomActual.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		zoomActual.setText("还原");
		zoomActual.addSelectionListener(new SelectionAdapter() {
			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				g.resetView();
			}
		});


		Button showArea = new Button(one, SWT.PUSH);
		showArea.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, false, false));
		showArea.setText("隐藏筛选器");
		showArea.setData("show", true);
		showArea.addSelectionListener(new SelectionAdapter() {
			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				boolean area = (boolean) showArea.getData("show");
				if (area) {
					showArea.setText("显示筛选器");
					showArea.setData("show", false);
					g.setControlarea("none");
				}else{
					showArea.setText("隐藏筛选器");
					showArea.setData("show", true);
					g.setControlarea("block");
				}
			}
		});

		Button small = new Button(one, SWT.PUSH);
		small.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		small.setText("缩略图");
		small.addSelectionListener(new SelectionAdapter() {
			private static final long serialVersionUID = 1L;
			@Override
			public void widgetSelected(SelectionEvent e) {
				JavaScriptExecutor executor = RWT.getClient().getService(
				JavaScriptExecutor.class);
				executor.execute("window.location.href='http://localhost:10010/small'");
			}
		});

		Combo arrow = new Combo(one, SWT.DROP_DOWN);
		arrow.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, false, false));
		arrow.setItems(new String[]{"出流量","入流量","总流量"});
		arrow.setText("流量");
		arrow.addSelectionListener(new SelectionListener() {
			private static final long serialVersionUID = 1L;
			@Override
			public void widgetSelected(SelectionEvent e) {
				int index = arrow.getSelectionIndex();
				switch (index) {
				case 0:
					break;
				case 1:
					break;
				case 2:
					break;
				default:
					break;
				}
			}
			@Override
			public void widgetDefaultSelected(SelectionEvent e) {
			}
		});


		Combo combo = new Combo(one, SWT.DROP_DOWN);
		combo.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, false, false));
		combo.setItems(new String[]{"红实出","紫实进","黑虚总","广播量"});
		combo.setText("状态");
		combo.addSelectionListener(new SelectionListener() {
			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				if (combo.getSelectionIndex()==0) {
					JsonArray array1 = new JsonArray();
					JsonObject json = new JsonObject();
					json.set("id", "4");
					json.set("color", "#FF3030");
					json.set("endvalue", "1000Kbps");
					json.set("startvalue", "");
					json.set("arrow", "1");
					json.set("dashed", "0");
					json.set("tooltip", "<h1>Ball</h1>");
					array1.add(json);
					if (edgeids!=null&&edgeids.size()>0) {
						for(String lastid : edgeids){
							JsonObject json2 = new JsonObject();
							json2.set("id", lastid);
							json2.set("color", "#FF3030");
							json2.set("endvalue", "2000Kbps");
							json2.set("startvalue", "1000Kbps");
							json2.set("arrow", "1");
							json2.set("dashed", "0");
							json2.set("tooltip", "<h1>Balls</h1>");
							array1.add(json2);
						}
					}
					g.updateEdgeStatus(array1);
				}if (combo.getSelectionIndex()==1) {
					JsonArray array1 = new JsonArray();
					JsonObject json = new JsonObject();
					json.set("id", "4");
					json.set("color", "#D02090");
					json.set("endvalue", "1000Kbps");
					json.set("startvalue", "1000Kbps");
					json.set("arrow", "-1");
					json.set("dashed", "0");
					array1.add(json);
					if (edgeids!=null&&edgeids.size()>0) {
						for(String lastid : edgeids){
							JsonObject json2 = new JsonObject();
							json2.set("id", lastid);
							json2.set("color", "#D02090");
							json2.set("endvalue", "2000Kbps");
							json2.set("startvalue", "1000Kbps");
							json2.set("arrow", "-1");
							json2.set("dashed", "0");
							array1.add(json2);
						}
					}
					g.updateEdgeStatus(array1);
				}if (combo.getSelectionIndex()==2) {
					JsonArray array1 = new JsonArray();
					JsonObject json = new JsonObject();
					json.set("id", "4");
					json.set("color", "#000000");
					json.set("endvalue", "1000Kbps");
					json.set("startvalue", "1000Kbps");
					json.set("arrow", "2");
					json.set("dashed", "1");
					array1.add(json);
					if (edgeids!=null&&edgeids.size()>0) {
						for(String lastid : edgeids){
							JsonObject json2 = new JsonObject();
							json2.set("id", lastid);
							json2.set("color", "#000000");
							json2.set("endvalue", "2000Kbps");
							json2.set("startvalue", "1000Kbps");
							json2.set("arrow", "2");
							json2.set("dashed", "1");
							array1.add(json2);
						}
					}
					g.updateEdgeStatus(array1);
				}if (combo.getSelectionIndex()==3) {
					JsonArray array1 = new JsonArray();
					JsonObject json = new JsonObject();
					json.set("id", "4");
					json.set("color", "#12db18");
					json.set("endvalue", "广播量");
					json.set("startvalue", "1000Kbps");
					json.set("arrow", "0");
					json.set("dashed", "0");
					array1.add(json);
					if (edgeids!=null&&edgeids.size()>0) {
						for(String lastid : edgeids){
							JsonObject json2 = new JsonObject();
							json2.set("id", lastid);
							json2.set("color", "#12db18");
							json2.set("endvalue", "广播量");
							json2.set("startvalue", "1000Kbps");
							json2.set("arrow", "0");
							json2.set("dashed", "0");
							array1.add(json2);
						}
					}
					g.updateEdgeStatus(array1);
				}
			}

			@Override
			public void widgetDefaultSelected(SelectionEvent e) {
			}
		});

		Button addChild = new Button(one, SWT.PUSH);
		addChild.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));

		Button finish = new Button(one, SWT.PUSH);
		finish.setLayoutData(new GridData(SWT.BEGINNING, SWT.CENTER, false, false));
		finish.setText("完成");
		finish.setBackground(finish.getDisplay().getSystemColor(SWT.COLOR_DARK_CYAN));
		finish.setForeground(finish.getDisplay().getSystemColor(SWT.COLOR_WHITE));
		finish.addSelectionListener(new SelectionAdapter() {
			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				if (filename==null||filename.equals("")) {
					filename = getId()+".xml";
				}
				g.setModelXml(filename);
				JavaScriptExecutor executor = RWT.getClient().getService(JavaScriptExecutor.class);
				executor.execute("window.location.href='http://localhost:10010/small'");
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
			if (filename!=null) {
				InputStream in = new FileInputStream(new File("D:/mxgraph/"+filename));
				g.loadGrapXml(mxUtils.readInputStream(in));
			}else{
				g.loadGrapXml(mxUtils.readInputStream(this.getClass().getResourceAsStream("models/edge_label.xml")));
			}
		}catch(Exception e){
			e.printStackTrace();
		}
		ids = new ArrayList<String>();
		edgeids = new ArrayList<String>();
		Object v2=((mxGraphModel)gd.getModel()).getCell("3");

		addChild.setText("适应");
		addChild.addSelectionListener(new SelectionAdapter() {
			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				g.automic();
			}
		});
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
				if (evt.getName().equals("isCompleted")) {
					boolean isCompleted = (boolean) evt.getProperty("isCompleted");
					if (isCompleted) {
						System.out.println("初始化完成，开始载入数据...");
					}
				}
				if (evt.getName().equals(MxGraphEvent.MOUSE_DOWN)){
					double x = (double) evt.getProperty("x");
					double y = (double) evt.getProperty("y");
					int button = (int) evt.getProperty("button");
					if (button == 0){
						String id= getId();
						ids.add(id);
						int styleNum = (int) (Math.random()*4);
						int statusNum = (int) (Math.random()*4);
						String style;
						String status;
						if (styleNum==1) {
							style = style6;
						}else{
							style = style5;
						}
						if (statusNum==1) {
							status = "error";
						}else{
							status = "unconn";
						}
						Object v = gd.insertVertex(parentG,id, "node!", x, y, 60, 60, style);
						g.setTooltip(id, "<h1>abcd</h1>"+ "<img src='rwt-resources/graph/images/"+status+".png"+"'/>");
						g.addCellOverlay(id, "rwt-resources/graph/images/"+status+".png", 16, 16, status);
						lastids = getId();
						edgeids.add(lastids);
						gd.insertEdge(parentG, lastids, "", v2, v, style4);
						g.setTooltip(lastids, "<h1>efgh</h1>"+ "<img src='rwt-resources/graph/images/"+status+".png"+"'/>");
					}else{
//						for(String id:ids){
//							g.removeCellOverlays(id);
//						}
						Menu menu = createEditPopup((int)x,(int)y);
						menu.setVisible(true);
					}
				}else if (evt.getName().equals(MxGraphEvent.MOUSE_HOVER)){
					double x = (double) evt.getProperty("x");
					double y = (double) evt.getProperty("y");
					//String id = (String) evt.getProperty("id");
					hoverText.setText("aaaaaa");
					hoverText.pack();
					hoverText.setLocation((int)x, (int)y);
					hoverText.setVisible(true);
				}else if (evt.getName().equals(MxGraphEvent.MOUSE_LEAVE)){
					hoverText.setVisible(false);
				}

			}});
		g.addListener(SWT.MouseWheel, new Listener() {

			private static final long serialVersionUID = 1L;

			@Override
			public void handleEvent(Event event) {
				System.out.println(event);

			}
		});
		g.setArrowOffset(0.5);
		g.setTextAutoRotation(true);
	}

	/* 
     * 创建一个右键菜单 通过样式值SWT.POP_UP来创建一个右键弹出菜单 
     */  
    public static Menu createEditPopup(int x,int y) {  
        Menu popMenu = new Menu(shell, SWT.POP_UP);  
        //popMenu.setVisible(true);
        popMenu.setLocation(x, y+60);
        MenuItem cutItem = new MenuItem(popMenu, SWT.PUSH);  
        cutItem.setText("&C&u&&t");  
        MenuItem copyItem = new MenuItem(popMenu, SWT.PUSH);  
        copyItem.setText("&Copy");  
        MenuItem pasteItem = new MenuItem(popMenu, SWT.PUSH);  
        pasteItem.setText("&Paste");  
        cutItem.addSelectionListener(new SelectionListener() {  
			private static final long serialVersionUID = 1L;
			@Override  
            public void widgetSelected(SelectionEvent arg0) {  
				PortPropertiesDlg portDlg = new PortPropertiesDlg("strom", "break");
				portDlg.open();
            }  
            @Override  
            public void widgetDefaultSelected(SelectionEvent arg0) {  
            }  
        });  
        pasteItem.addSelectionListener(new SelectionListener() {  
			private static final long serialVersionUID = 1L;
			@Override  
            public void widgetSelected(SelectionEvent arg0) {  
                System.out.println("paste");  
            }  
            @Override  
            public void widgetDefaultSelected(SelectionEvent arg0) {  
            }  
        });  
        copyItem.addSelectionListener(new SelectionListener() {  
			private static final long serialVersionUID = 1L;
			@Override  
            public void widgetSelected(SelectionEvent arg0) {  
                System.out.println("copy");  
            }  
            @Override  
            public void widgetDefaultSelected(SelectionEvent arg0) {  
            }  
        });  
        return popMenu;  
    }
}
