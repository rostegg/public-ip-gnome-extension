const { Gtk, Gio, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const REFRESH_RATE = 'refresh-rate';
const DISPLAY_ONLY_ICONS = 'display-only-icon';
const API_SERVICE = 'api-service';
const API_SERVICES = ['ip-api.com', 'ipapi.co', 'myip.com', 'ip.sb']

const init = () => {/* Empty */};

class PublicIpPrefs extends Gtk.Grid {
	
	constructor() {
		super();
		this.margin = 15;
		this.row_spacing = 3;
		this._settings = Convenience.getSettings();
		
		let label = null;
		let container = null;

		/* Refresh rate */
		container = new Gtk.HBox({spacing: 5});
		label = new Gtk.Label({
			label: "Refresh rate (in seconds)",
			margin_left: 10
		});
		let refreshSpinButton = new Gtk.SpinButton();
		refreshSpinButton.set_sensitive(true);
		refreshSpinButton.set_range(1, 1800);
		refreshSpinButton.set_value(this._settings.get_int(REFRESH_RATE));
		refreshSpinButton.set_increments(5, 10);
		this._settings.bind(REFRESH_RATE, refreshSpinButton, 'value', Gio.SettingsBindFlags.DEFAULT);
		container.pack_start(label, 0,0,0);
		container.pack_end(refreshSpinButton, 0,0,0);
		this.attach(container, 0, 1, 1, 1);

		/* Display only flag */
		container = new Gtk.HBox({spacing: 5});
		label = new Gtk.Label({
			label: "Display only flag",
			margin_left: 10
		});
    	let displayIconButton = new Gtk.CheckButton({margin_top: 5});
		this._settings.bind(DISPLAY_ONLY_ICONS, displayIconButton, 'active', Gio.SettingsBindFlags.DEFAULT);
		container.pack_start(label, 0,0,0);
		container.pack_end(displayIconButton, 0,0,0);
		this.attach(container, 0, 2, 1, 1);

		/* API service endpoint */
		container = new Gtk.HBox({spacing: 5});
		label = new Gtk.Label({
			label: "API service",
			margin_left: 10
		});

		let apiServicesComboBox = new Gtk.ComboBoxText();
		API_SERVICES.forEach((service) => apiServicesComboBox.append(service,service));
		this._settings.bind(API_SERVICE, apiServicesComboBox, 'active-id', Gio.SettingsBindFlags.DEFAULT);
		container.pack_start(label, 0,0,0);
		container.pack_end(apiServicesComboBox, 0,0,0);
		this.attach(container, 0, 3, 1, 1);
	}
}

const buildPrefsWidget = () => {
	let widget = new PublicIpPrefs();
	widget.show_all();
	return widget;
}