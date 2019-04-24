const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Settings = Convenience.getSettings();

const NO_CONNECTION = 'Waiting for connection';
const MENU_POSITION = 'right';
const CONNECTION_REFUSED = 'Connection refused';

let _label, _icon;

const _makeRequest = (callback) => {
  let endpoint = `http://ip-api.com/json/?fields=status,countryCode,query`;

  let _httpSession = new Soup.SessionAsync();
  Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

  let request = Soup.Message.new('GET', endpoint);

  const _processRequest = (_httpSession, message) => {
    if (message.status_code !== 200) {
      callback(message.status_code, null);
      return;
    }
    let responseJSON = request.response_body.data;
    let responseData = JSON.parse(responseJSON);
    callback(null, responseData);
  };

  _httpSession.queue_message(request, _processRequest);
};

class IpInfoIndicator extends PanelMenu.Button {

  constructor() {
    super(0.0, "Ip Info Indicator", false);
    let hbox = new St.BoxLayout({style_class: 'ip-data-panel'});

    _icon = new St.Icon({
      gicon: null,
      style_class: 'system-status-icon'
    });

    _label = new St.Label({
      text: Settings.get_boolean('display-only-icon') ? '' : NO_CONNECTION,
      y_align: Clutter.ActorAlign.CENTER
    });
    
    hbox.add_child(_icon);
    hbox.add_child(_label);

    this.actor.add_actor(hbox);

    Main.panel.addToStatusArea('ip-info-indicator', this, 1, MENU_POSITION);

    this.requestCallback = (err, responseData) => {
      if (responseData) {
        let countryCode = responseData.countryCode.toLowerCase();
        let ipAddress = responseData.query;
        _label.text = Settings.get_boolean('display-only-icon') ? '' : ipAddress;
        _icon.gicon = Gio.icon_new_for_string(`${Me.path}/icons/flags/${countryCode}.png`);  
      } else {
        _label.text = Settings.get_boolean('display-only-icon') ? '' : CONNECTION_REFUSED;
        _icon.gicon = Gio.icon_new_for_string(`${Me.path}/icons/flags/error.png`);  
      }
    }
  
    this.destroy = () => {
      this.removeTimer();
      super.destroy();
    }
  
    this.update = () => {
      _makeRequest(this.requestCallback);
      return true;
    }
  
    this.removeTimer = () => {
      if (this.timer) {
        Mainloop.source_remove(this.timer);
        this.timer = null;
      }
    }
  
    this.updateRefreshRate = () => {
      this.refreshRate = Settings.get_int('refresh-rate');
      this.removeTimer();
      this.timer = Mainloop.timeout_add_seconds(this.refreshRate, this.update.bind(this));
    }
  
    this.updateDisplayMode = () => {
      Main.panel.statusArea['ip-info-indicator'] = null;
      Main.panel.addToStatusArea('ip-info-indicator', this, 1, MENU_POSITION);
      this.update();
    }

    Settings.connect('changed::refresh-rate', this.updateRefreshRate.bind(this));
    Settings.connect('changed::display-only-icon', this.updateDisplayMode.bind(this));
    
    this.update();
    this.updateRefreshRate();
  }

  
};

let _indicator;

const init = () => {/* Empty */};

const enable = () => _indicator = new IpInfoIndicator;

const disable = () => _indicator.destroy();
