package com.weadmin.mxgraph_rap;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

import org.eclipse.rap.json.JsonObject;
import org.eclipse.rap.json.JsonValue;
import org.eclipse.rap.rwt.RWT;
import org.eclipse.rap.rwt.client.service.ClientFileLoader;
import org.eclipse.rap.rwt.remote.AbstractOperationHandler;
import org.eclipse.rap.rwt.remote.Connection;
import org.eclipse.rap.rwt.remote.OperationHandler;
import org.eclipse.rap.rwt.remote.RemoteObject;
import org.eclipse.rap.rwt.service.ResourceManager;
import org.eclipse.rap.rwt.widgets.WidgetUtil;
import org.eclipse.swt.events.ControlEvent;
import org.eclipse.swt.events.ControlListener;
import org.eclipse.swt.graphics.Point;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Layout;


public abstract class SVWidgetBase extends Composite {

	public class CustomRes{
		private String path;
		private boolean load;
		private boolean css;
		
		public CustomRes(String path, boolean load, boolean css) {
			super();
			this.path = path;
			this.load = load;
			this.css = css;
		}

		public String getPath() {
			return path;
		}

		public boolean isLoad() {
			return load;
		}

		public boolean isCss() {
			return css;
		}
		
	}

	private static final String RESOURCES_PATH = "resources/";
	
	private ArrayList<CustomRes> resources;

	private final RemoteObject remoteObject;

	private final OperationHandler operationHandler = new AbstractOperationHandler() {
		@Override
		public void handleSet(JsonObject properties) {
			handleSetProp(properties);
		}

		@Override
		public void handleCall(String method, JsonObject parameters) {
			handleCallMethod(method, parameters);
		}

		@Override
		public void handleNotify(String event, JsonObject properties) {
			handleCallNotify(event,properties);
		}
	};
	
	
	
	protected abstract void handleSetProp(JsonObject properties);
	protected abstract void handleCallMethod(String method, JsonObject parameters);
	protected abstract void handleCallNotify(String event, JsonObject parameters);
	
	protected abstract String getWidgetName();
	
	protected abstract ArrayList<CustomRes> getCustomRes();
	
	protected void setRemoteProp(String name,JsonObject prop){
		remoteObject.set(name, prop);
	}
	protected void setRemoteProp(String name,String prop){
		remoteObject.set(name, prop);
	}
	protected void setRemoteProp(String name,boolean prop){
		remoteObject.set(name, prop);
	}
	
	protected void setRemoteProp(String name,double prop){
		remoteObject.set(name, prop);
	}
	protected void setRemoteProp(String name,int prop){
		remoteObject.set(name, prop);
	}
	
	protected void callRemoteMethod(String name,JsonObject parameters){
		remoteObject.call(name, parameters);
	}
	
	
	private String getRemoteName(){
		return "eclipsesource."+ getWidgetName();
	}
	
	private String getRegisterPath(){
		return getWidgetName()+"/";
	}
	

	public SVWidgetBase(Composite parent, int style) {
		super(parent, style);
		resources = new ArrayList<>();
		resources.add(new CustomRes("handler.js", true, false));
		resources.addAll(getCustomRes());
		
		registerResources();
		loadJavaScript();
		Connection connection = RWT.getUISession().getConnection();
		remoteObject = connection.createRemoteObject(getRemoteName());
		remoteObject.setHandler(operationHandler);
		//remoteObject.listen("modelUpdate", true);
		
		remoteObject.set("parent", WidgetUtil.getId(this));
		
		this.addControlListener(new ControlListener() {
			
			@Override
			public void controlResized(ControlEvent e) {
				Point size = getSize();
				setRemoteSize(size.x, size.y);
				
			}
			
			@Override
			public void controlMoved(ControlEvent e) {
			}
		});

	}
	
	private void setRemoteSize(int width,int height) {
		JsonObject parameters = new JsonObject();
		parameters.add("width", width);
		parameters.add("height", height);
		remoteObject.set("size", parameters);
		
	}

	private void registerResources() {
		ResourceManager resourceManager = RWT.getResourceManager();
		boolean isRegistered = resourceManager.isRegistered(getRegisterPath() + resources.get(0).getPath());
		if (!isRegistered) {
			try {
				for (CustomRes res : resources) {
					register(resourceManager, res.getPath());
				}
			} catch (IOException ioe) {
				throw new IllegalArgumentException("Failed to load resources", ioe);
			}
		}
	}

	private void loadJavaScript() {

		ClientFileLoader loader = RWT.getClient().getService(ClientFileLoader.class);
		ResourceManager resourceManager = RWT.getResourceManager();
		
		for (CustomRes res : resources) {
			if (res.isLoad()){
				if (res.isCss())
					loader.requireCss(resourceManager.getLocation(getRegisterPath()+res.getPath()));
				else
					loader.requireJs(resourceManager.getLocation(getRegisterPath()+res.getPath()));
			}
		}

	}

	private void register(ResourceManager resourceManager, String fileName) throws IOException {
		ClassLoader classLoader = SVWidgetBase.class.getClassLoader();
		InputStream inputStream = classLoader.getResourceAsStream(RESOURCES_PATH + fileName);
		try {
			resourceManager.register(getRegisterPath() + fileName, inputStream);
		} finally {
			inputStream.close();
		}
	}
	

	////////////////////
	// overwrite methods

	@Override
	public void setLayout(Layout layout) {
		throw new UnsupportedOperationException("Cannot change internal layout of CkEditor");
	}
	
	@Override
	public void dispose() {
		remoteObject.destroy();
		super.dispose();
	}

	
}