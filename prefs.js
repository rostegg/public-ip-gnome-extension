const { Gtk, Gio, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const REFRESH_RATE = 'refresh-rate';
const API_SERVICE = 'api-service';
const API_SERVICES = ['ip-api.com', 'ipapi.co', 'myip.com', 'ip.sb', 'local-ip'];
const DISPLAY_MODE = 'display-mode';
const DISPLAY_MODES = ['only-flag', 'only-ip', 'ip-and-flag'];
const INDICATOR_ALIGN = 'indicator-panel-align';
const INDICATOR_ALIGNS = ['left', 'right', 'center'];
const ON_MOUSE_OVER_STATE = 'enable-onmouse-display';

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
			label: "Display mode:",
			margin_left: 10
		});
		let displayModeComboBox = new Gtk.ComboBoxText();
		DISPLAY_MODES.forEach((mode) => displayModeComboBox.append(mode,mode));
		this._settings.bind(DISPLAY_MODE, displayModeComboBox, 'active-id', Gio.SettingsBindFlags.DEFAULT);
		container.pack_start(label, 0,0,0);
		container.pack_end(displayModeComboBox, 0,0,0);
		this.attach(container, 0, 2, 1, 1);

		/* API service endpoint */
		container = new Gtk.HBox({spacing: 5});
		label = new Gtk.Label({
			label: "API service:",
			margin_left: 10
		});

		let apiServicesComboBox = new Gtk.ComboBoxText();
		API_SERVICES.forEach((service) => apiServicesComboBox.append(service,service));
		this._settings.bind(API_SERVICE, apiServicesComboBox, 'active-id', Gio.SettingsBindFlags.DEFAULT);
		container.pack_start(label, 0,0,0);
		container.pack_end(apiServicesComboBox, 0,0,0);
		this.attach(container, 0, 3, 1, 1);

		/* Indicator align */
		container = new Gtk.HBox({spacing: 5});
		label = new Gtk.Label({
			label: "Indicator align:",
			margin_left: 10
		});

		let indicatorAlignComboBox = new Gtk.ComboBoxText();
		INDICATOR_ALIGNS.forEach((align) => indicatorAlignComboBox.append(align,align));
		this._settings.bind(INDICATOR_ALIGN, indicatorAlignComboBox, 'active-id', Gio.SettingsBindFlags.DEFAULT);
		container.pack_start(label, 0,0,0);
		container.pack_end(indicatorAlignComboBox, 0,0,0);
		this.attach(container, 0, 4, 1, 1);
		
		/* Enable onMouseOver */
		container = new Gtk.HBox({spacing: 5});
		label = new Gtk.Label({
			label: "Enable onMouseOver",
			margin_left: 10
		});

		let switchWidget = new Gtk.Switch();
		switchWidget.set_sensitive(true);
		switchWidget.set_active(this._settings.get_boolean(ON_MOUSE_OVER_STATE));
		this._settings.bind(ON_MOUSE_OVER_STATE, switchWidget, 'active', Gio.SettingsBindFlags.DEFAULT);
		container.pack_start(label, 0,0,0);
		container.pack_end(switchWidget, 0,0,0);
		this.attach(container, 0, 5, 1, 1);
		
	}
}

const buildPrefsWidget = () => {
	let widget = new PublicIpPrefs();
	widget.show_all();
	return widget;
}