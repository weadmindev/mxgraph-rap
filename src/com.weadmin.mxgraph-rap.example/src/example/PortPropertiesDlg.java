package example;

import org.eclipse.jface.dialogs.Dialog;
import org.eclipse.rap.rwt.RWT;
import org.eclipse.swt.SWT;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.graphics.Point;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Combo;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Control;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Group;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.Spinner;


public class PortPropertiesDlg extends Dialog{
	private static final long serialVersionUID = 1L;

	private String[] interfaceNames;

	private String networkNodeName;

	private String serverNodeName;

	private String interfaceName;

	private Combo interfaceCombo;

	private Spinner spokflow;
	private Label lbmidflow;
	private Spinner sperrorflow;

	private Spinner spokpkts;
	private Label lbmidpkts;
	private Spinner sperrorpkts;

	private Spinner spokbroad;
	private Label lbmidbroad;
	private Spinner sperrorbroad;

	private Spinner spokPercent;
	private Label lbmidPercent;// Percent
	private Spinner sperrorPercent;

	private int warnflow = 50;
	private int errorflow = 2000;
	private int warnpkts = 50;
	private int errorpkts = 1000;
	private int warnbroad = 20;
	private int errorbroad = 200;
	private int warnpercent = 20;
	private int errorpercent = 80;
	
	@Override
	protected void configureShell(Shell newShell) {
		super.configureShell(newShell);
		newShell.setText("网络接口绑定");
	}
	
	public void setInterfaceNames(String[] interfaceNames){
		this.interfaceNames = interfaceNames;
	}

	public String getInterfaceName() {
		return this.interfaceName;
	}

	public void setInterfaceName(String interfaceName) {
		this.interfaceName = interfaceName;
	}
	
	protected PortPropertiesDlg(String networkNodeName, String serverNodeName) {
		super(Display.getCurrent().getActiveShell());
		this.networkNodeName = networkNodeName;
		this.serverNodeName = serverNodeName;
	}

	@Override
	protected Control createDialogArea(Composite parent) {
		Composite content = (Composite) super.createDialogArea(parent);
		content.setLayout(null);

		Group group = new Group(content, SWT.NONE);
		group.setText("基本信息");
		group.setBounds(10, 0, 374, 142);

		Label lblNewLabel_2 = new Label(group, SWT.NONE);
		lblNewLabel_2.setBounds(10, 38, 90, 17);
		lblNewLabel_2.setText("被连接的设备:");

		Label lblServerName = new Label(group, SWT.NONE);
		lblServerName.setBounds(116, 38, 239, 17);
		lblServerName.setText(serverNodeName);

		Label lblNewLabel_1 = new Label(group, SWT.NONE);
		lblNewLabel_1.setBounds(10, 73, 90, 17);
		lblNewLabel_1.setText("网络设备名称:");

		Label lblNetWorkName = new Label(group, SWT.NONE);
		lblNetWorkName.setBounds(116, 73, 239, 17);
		lblNetWorkName.setText(networkNodeName);

		Label lblNewLabel = new Label(group, SWT.NONE);
		lblNewLabel.setBounds(10, 109, 90, 17);
		lblNewLabel.setText("网络接口名称:");

		interfaceCombo = new Combo(group, SWT.NONE);
		interfaceCombo.setBounds(116, 106, 244, 25);
		interfaceCombo.setText("网络接口");

		Group composite = new Group(content, SWT.NONE);
		composite.setText("阀值信息");
		composite.setBounds(10, 145, 374, 380);

		composite.setLayout(new GridLayout(3, false));
		Label lbflow = new Label(composite, SWT.NONE);
		lbflow.setText("总流量(Kbps)");
		Label lbokflow = new Label(composite, SWT.NONE);
		GridData gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lbokflow.setLayoutData(gd_okflow);
		lbokflow.setText("<span style=\"width:90px; height:22px; background-color:green;display:block;\"></span>");
		lbokflow.setData(RWT.MARKUP_ENABLED, true);

		spokflow = new Spinner(composite, SWT.BORDER);
		spokflow.setMaximum(80000000);
		spokflow.setSelection(warnflow);
		spokflow.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		spokflow.addSelectionListener(new SelectionAdapter() {

			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				flowEvent();
			}
		});
		Label lbflow1 = new Label(composite, SWT.NONE);
		lbflow1.setText("  ");
		Label lbwarnflow = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lbwarnflow.setLayoutData(gd_okflow);
		lbwarnflow.setText("            ");
		lbwarnflow.setText("<span style=\"width:90px; height:22px; background-color:yellow;display:block;\"></span>");
		lbwarnflow.setData(RWT.MARKUP_ENABLED, true);
		lbmidflow = new Label(composite, SWT.NONE);
		lbmidflow.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label lbflow2 = new Label(composite, SWT.NONE);
		lbflow2.setText("");
		Label lberrorflow = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lberrorflow.setLayoutData(gd_okflow);
		lberrorflow.setText("<span style=\"width:90px; height:22px; background-color:red;display:block;\"></span>");
		lberrorflow.setData(RWT.MARKUP_ENABLED, true);
		sperrorflow = new Spinner(composite, SWT.BORDER);
		sperrorflow.setMaximum(900000000);
		sperrorflow.setSelection(errorflow);
		sperrorflow.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		sperrorflow.addSelectionListener(new SelectionAdapter() {

			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				flowEvent();
			}
		});
		lbmidflow.setText("> " + spokflow.getText() + " && < " + sperrorflow.getText());

		Label lbflowPercent = new Label(composite, SWT.NONE);
		lbflowPercent.setText("带宽占用比(%)");
		Label lbokflowPercent = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lbokflowPercent.setLayoutData(gd_okflow);
		lbokflowPercent.setText("<span style=\"width:90px; height:22px; background-color:green;display:block;\"></span>");
		lbokflowPercent.setData(RWT.MARKUP_ENABLED, true);

		spokPercent = new Spinner(composite, SWT.BORDER);
		spokPercent.setMaximum(80000000);
		spokPercent.setSelection(warnpercent);
		spokPercent.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		spokPercent.addSelectionListener(new SelectionAdapter() {

			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				percentEvent();
			}
		});
		Label lbflowPercent1 = new Label(composite, SWT.NONE);
		lbflowPercent1.setText("  ");
		Label lbwarnflowPercent = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lbwarnflowPercent.setLayoutData(gd_okflow);
		lbwarnflowPercent.setText("<span style=\"width:90px; height:22px; background-color:yellow;display:block;\"></span>");
		lbwarnflowPercent.setData(RWT.MARKUP_ENABLED, true);
		lbmidPercent = new Label(composite, SWT.NONE);
		lbmidPercent.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label lbflowPercent2 = new Label(composite, SWT.NONE);
		lbflowPercent2.setText("");
		Label lberrorflowPercent = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lberrorflowPercent.setLayoutData(gd_okflow);
		lberrorflowPercent.setText("<span style=\"width:90px; height:22px; background-color:red;display:block;\"></span>");
		lberrorflowPercent.setData(RWT.MARKUP_ENABLED, true);
		sperrorPercent = new Spinner(composite, SWT.BORDER);
		sperrorPercent.setMaximum(900000000);
		sperrorPercent.setSelection(errorpercent);
		sperrorPercent.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		lbmidPercent.setText("> " + spokPercent.getText() + " && < " + sperrorPercent.getText());
		sperrorPercent.addSelectionListener(new SelectionAdapter() {

			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				percentEvent();
			}
		});
		Label lbpkts = new Label(composite, SWT.NONE);
		lbpkts.setText("帧流量(Pkts/s)");
		Label lbokpkts = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lbokpkts.setLayoutData(gd_okflow);
		lbokpkts.setText("<span style=\"width:90px; height:22px; background-color:green;display:block;\"></span>");
		lbokpkts.setData(RWT.MARKUP_ENABLED, true);
		spokpkts = new Spinner(composite, SWT.BORDER);
		spokpkts.setMaximum(80000000);
		spokpkts.setSelection(warnpkts);
		spokpkts.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		spokpkts.addSelectionListener(new SelectionAdapter() {

			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				pktsEvent();
			}
		});
		Label lbpkts1 = new Label(composite, SWT.NONE);
		lbpkts1.setText("  ");
		Label lbwarnpkts = new Label(composite, SWT.NONE);
		lbwarnpkts.setText("<span style=\"width:90px; height:22px; background-color:yellow;display:block;\"></span>");
		lbwarnpkts.setData(RWT.MARKUP_ENABLED, true);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lbwarnpkts.setLayoutData(gd_okflow);
		lbmidpkts = new Label(composite, SWT.NONE);
		lbmidpkts.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));

		Label lbpkts2 = new Label(composite, SWT.NONE);
		lbpkts2.setText("");
		Label lberrorpkts = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lberrorpkts.setLayoutData(gd_okflow);
		lberrorpkts.setText("<span style=\"width:90px; height:22px; background-color:red;display:block;\"></span>");
		lberrorpkts.setData(RWT.MARKUP_ENABLED, true);
		sperrorpkts = new Spinner(composite, SWT.BORDER);
		sperrorpkts.setMaximum(900000000);
		sperrorpkts.setSelection(errorpkts);
		sperrorpkts.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		lbmidpkts.setText("> " + spokpkts.getText() + " && < " + sperrorpkts.getText());
		sperrorpkts.addSelectionListener(new SelectionAdapter() {

			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				pktsEvent();
			}
		});
		Label lbbroad = new Label(composite, SWT.NONE);
		lbbroad.setText("广播量(个/s)");
		Label lbokbroad = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lbokbroad.setLayoutData(gd_okflow);
		lbokbroad.setText("<span style=\"width:90px; height:22px; background-color:green;display:block;\"></span>");
		lbokbroad.setData(RWT.MARKUP_ENABLED, true);
		spokbroad = new Spinner(composite, SWT.BORDER);
		spokbroad.setMaximum(80000000);
		spokbroad.setSelection(warnbroad);
		spokbroad.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		spokbroad.addSelectionListener(new SelectionAdapter() {

			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				broadEvent();
			}
		});
		Label lbbroad1 = new Label(composite, SWT.NONE);
		lbbroad1.setText("  ");
		Label lbwarnbroad = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lbwarnbroad.setLayoutData(gd_okflow);
		lbmidbroad = new Label(composite, SWT.NONE);
		lbmidbroad.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		lbwarnbroad.setText("<span style=\"width:90px; height:22px; background-color:yellow;display:block;\"></span>");
		lbwarnbroad.setData(RWT.MARKUP_ENABLED, true);
		Label lbbroad2 = new Label(composite, SWT.NONE);
		lbbroad2.setText("");
		Label lberrorbroad = new Label(composite, SWT.NONE);
		gd_okflow = new GridData(GridData.FILL_HORIZONTAL);
		gd_okflow.widthHint = 80;
		lberrorbroad.setLayoutData(gd_okflow);
		lberrorbroad.setText("<span style=\"width:90px; height:22px; background-color:red;display:block;\"></span>");
		lberrorbroad.setData(RWT.MARKUP_ENABLED, true);
		sperrorbroad = new Spinner(composite, SWT.BORDER);
		sperrorbroad.setMaximum(900000000);
		sperrorbroad.setSelection(errorbroad);
		sperrorbroad.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		lbmidbroad.setText("> " + spokbroad.getText() + " && < " + sperrorbroad.getText());
		sperrorbroad.addSelectionListener(new SelectionAdapter() {

			private static final long serialVersionUID = 1L;

			@Override
			public void widgetSelected(SelectionEvent e) {
				broadEvent();
			}
		});

		return content;
	}
	
	public void flowEvent(){
		lbmidflow.setText("> " + spokflow.getText() + " && < " + sperrorflow.getText());
	}
	
	public void percentEvent(){
		lbmidPercent.setText("> " + spokPercent.getText() + " && < " + sperrorPercent.getText());
	}
	
	public void broadEvent(){
		lbmidbroad.setText("> " + spokbroad.getText() + " && < " + sperrorbroad.getText());
	}
	
	public void pktsEvent(){
		lbmidpkts.setText("> " + spokpkts.getText() + " && < " + sperrorpkts.getText());
	}

	public void loadData() {
		
		if(interfaceNames!=null&&interfaceNames.length>0){
			interfaceCombo.setItems(interfaceNames);
			if (interfaceName != null && interfaceName.trim().length() > 0) {
				interfaceCombo.select(interfaceCombo.indexOf(interfaceName));
			} else {
				interfaceCombo.select(0);
			}
		}
		
	}

	@Override
	protected void initializeBounds() {
		super.initializeBounds();
		loadData();
	}

	@Override
	protected Point getInitialSize() {
		return new Point(400, 630);
	}

	@Override
	protected void okPressed() {
		interfaceName = interfaceCombo.getText();
		
		
		
		super.okPressed();
	}
}
