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
const Compatibility = Me.imports.compatibility;
const GLib = imports.gi.GLib;

const NO_CONNECTION = 'Waiting for connection';
const CANT_GET_LOCAL_IP = `Can't get local ip`;
const CONNECTION_REFUSED = 'Connection refused';

let _label, _icon;

const makeHttpSession = () => {
  let httpSession = new Soup.SessionAsync();
  Soup.Session.prototype.add_feature.call(httpSession, new Soup.ProxyResolverDefault());
  return httpSession;
}

const servicesRequestProcessors = {
  'ip-api.com': {
    endpoint: `http://ip-api.com/json/?fields=status,countryCode,query,isp`,
    process: function (callback) {
      let httpSession = makeHttpSession()
      let request = Soup.Message.new('GET', this.endpoint);
      const _processRequest = (httpSession, message) => {
        if (message.status_code !== 200) {
          callback(message.status_code, null);
          return;
        }
        let responseJSON = request.response_body.data;
        let responseData = JSON.parse(responseJSON);
        let simplifiedResponseData = { ip: responseData.query, countryCode: responseData.countryCode, isp: responseData.isp };
        callback(null, simplifiedResponseData);
      };
  
      httpSession.queue_message(request, _processRequest);
    }
  },

  'ipapi.co': {
    endpoint: `https://ipapi.co/json/`,
    process: function (callback) {
      let httpSession = makeHttpSession()
      let request = Soup.Message.new('GET', this.endpoint);
      const _processRequest = (httpSession, message) => {
        if (message.status_code !== 200) {
          callback(message.status_code, null);
          return;
        }
        let responseJSON = request.response_body.data;
        let responseData = JSON.parse(responseJSON);
        if (responseData.error) {
          callback(responseData.reason, null);
          return;
        }
        let simplifiedResponseData = { ip: responseData.ip, countryCode: responseData.country };
        callback(null, simplifiedResponseData);
      };
  
      httpSession.queue_message(request, _processRequest);
    }
  },

  'myip.com': {
    endpoint: `https://api.myip.com`,
    process: function (callback) {
      let httpSession = makeHttpSession()
      let request = Soup.Message.new('GET', this.endpoint);
      const _processRequest = (httpSession, message) => {
        if (message.status_code !== 200) {
          callback(message.status_code, null);
          return;
        }
        let responseJSON = request.response_body.data;
        let responseData = JSON.parse(responseJSON);
        let simplifiedResponseData = { ip: responseData.ip, countryCode: responseData.cc };
        callback(null, simplifiedResponseData);
      };
  
      httpSession.queue_message(request, _processRequest);
    }
  },

  'ip.sb': {
    endpoint: `https://api.ip.sb/geoip`,
    process: function (callback) {
      let httpSession = makeHttpSession()
      let request = Soup.Message.new('GET', this.endpoint);
      const _processRequest = (httpSession, message) => {
        if (message.status_code !== 200) {
          callback(message.status_code, null);
          return;
        }
        let responseJSON = request.response_body.data;
        let responseData = JSON.parse(responseJSON);
        let simplifiedResponseData = { ip: responseData.ip, countryCode: responseData.country_code };
        callback(null, simplifiedResponseData);
      };
  
      httpSession.queue_message(request, _processRequest);
    }
  },
  // thanks to https://github.com/Josholith/gnome-extension-lan-ip-address/blob/master/extension.js
  'route-ip': {
    process: function (callback) {
      const commandOutputBytes = GLib.spawn_command_line_sync('ip route get 1.1.1.1')[1];
      let commandOutputString = Array.from(commandOutputBytes).reduce(
        (accumulator, currentValue) => accumulator + String.fromCharCode(currentValue),
        ''
      );
      let matches = commandOutputString.match(/src [^ ]+/g);
      const lanIpAddress = matches ? matches[0].split(' ')[1] : CANT_GET_LOCAL_IP
      callback(null, { ip: lanIpAddress });
    }
  },
  'hostname': {
    process: function (callback) {
      const commandOutputBytes = GLib.spawn_command_line_sync('hostname -I')[1];
      let commandOutputString = Array.from(commandOutputBytes).reduce(
        (accumulator, currentValue) => accumulator + String.fromCharCode(currentValue),
        ''
      );
      // get first ip from output
      const hostname = commandOutputString.split(' ')[0];
      callback(null, { ip: hostname });
    }
  }
}

const displayModeProcessors = {
  'ip-and-flag' : (err, responseData) => {
    _label.text = !responseData ? CONNECTION_REFUSED : responseData.ip + ' ' + responseData.isp;

    _icon.gicon = !responseData ? Gio.icon_new_for_string(`${Me.path}/icons/flags/error.png`) : 
                                    selectIcon(responseData);
  },
  'only-flag' : (err, responseData) => {
    _label.text = '';

    _icon.gicon = !responseData ? Gio.icon_new_for_string(`${Me.path}/icons/flags/error.png`) : 
                                    selectIcon(responseData);
  },
  'only-ip' : (err, responseData) => {
    _label.text = !responseData ? CONNECTION_REFUSED : responseData.ip;

    _icon.gicon = null;
  }
}

const selectIcon = (responseData) => {
  const defaultIconServices = ['route-ip', 'hostname'];
  const currentService = Settings.get_string('api-service');
  return defaultIconServices.includes(currentService) ? Gio.icon_new_for_string(`${Me.path}/icons/flags/local-ip-icon.png`) :
                                          Gio.icon_new_for_string(`${Me.path}/icons/flags/${responseData.countryCode}.png`);
}  

const updateDisplay = (displayMode = 'ip-and-flag') => {
  const currentService = Settings.get_string('api-service'), 
    currentMode = displayMode;
  const service = servicesRequestProcessors[currentService];
  const requestCallback = displayModeProcessors[currentMode];
  service.process(requestCallback);
};

let IpInfoIndicator = class IpInfoIndicator extends PanelMenu.Button {

  _init(menuAlignment, nameText, dontCreateMenu) {
    super._init(0.0, "Ip Info Indicator", false);
    let hbox = new St.BoxLayout({style_class: 'ip-data-panel'});

    _icon = new St.Icon({
      gicon: null,
      style_class: 'system-status-icon'
    });

    _label = new St.Label({
      text: Settings.get_boolean('display-mode') ? '' : NO_CONNECTION,
      y_align: Clutter.ActorAlign.CENTER
    });
    
    hbox.add_child(_icon);
    hbox.add_child(_label);

    Compatibility.getActor(this).add_actor(hbox);

    Main.panel.addToStatusArea('ip-info-indicator', this, 1, Settings.get_string('indicator-panel-align'));
  
    this.destroy = () => {
      this.removeTimer();
      super.destroy();
    }
  
    this.update = () => {
      updateDisplay(Settings.get_string('display-mode'));
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

    this.refreshPanel = () => {
      Main.panel.statusArea['ip-info-indicator'] = null;
      const align = Settings.get_string('indicator-panel-align');
      Main.panel.addToStatusArea('ip-info-indicator', this, 1, align);
    }
  
    this.updateDisplayMode = () => {
      this.refreshPanel();
      this.update();
    }

    this.updateAlign = () => {
      this.refreshPanel();
    }

    this.onClick = () => {
      this.update();
    }

    this.updateService = () => {
      this.update();
    }

    this.onEntryNotify = () => {
      Settings.get_boolean('enable-onmouse-display') 
        && Settings.get_string('display-mode') != 'ip-and-flag'
        && updateDisplay();
    }

    this.onLeaveNotify =() => {
      Settings.get_boolean('enable-onmouse-display')
        && Settings.get_string('display-mode') != 'ip-and-flag'
        && this.update();
    }

    Settings.connect('changed::refresh-rate', this.updateRefreshRate.bind(this));
    Settings.connect('changed::display-mode', this.updateDisplayMode.bind(this));
    Settings.connect('changed::api-service', this.updateService.bind(this));
    Settings.connect('changed::indicator-panel-align', this.updateAlign.bind(this));

    Compatibility.getActor(this).connect('button-press-event', this.onClick.bind(this));
    Compatibility.getActor(this).connect('enter-event', this.onEntryNotify.bind(this));
    Compatibility.getActor(this).connect('leave-event', this.onLeaveNotify.bind(this));
    
    this.update();
    this.updateRefreshRate();
  }

  
};

IpInfoIndicator = Compatibility.wrapClass(IpInfoIndicator);
 
let _indicator;

function init() {/* Empty */};

function enable() { _indicator = new IpInfoIndicator; }

function disable() { _indicator.destroy(); }
