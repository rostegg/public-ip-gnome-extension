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
let currentService = 'ip-api.com';

const servicesRequestProcessors = {
  'ip-api.com': {
    endpoint: `http://ip-api.com/json/?fields=status,countryCode,query`,
    process: (httpSession, request, callback) => {
      const _processRequest = (httpSession, message) => {
        if (message.status_code !== 200) {
          callback(message.status_code, null);
          return;
        }
        let responseJSON = request.response_body.data;
        let responseData = JSON.parse(responseJSON);
        let simplifiedResponseData = { ip: responseData.query, countryCode: responseData.countryCode };
        callback(null, simplifiedResponseData);
      };
  
      httpSession.queue_message(request, _processRequest);
    }
  },

  'ipapi.co': {
    endpoint: `https://ipapi.co/json/`,
    process: (httpSession, request, callback) => {
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
    process: (httpSession, request, callback) => {
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
    process: (httpSession, request, callback) => {
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
  }
}

const _makeRequest = (callback) => {
  let httpSession = new Soup.SessionAsync();
  Soup.Session.prototype.add_feature.call(httpSession, new Soup.ProxyResolverDefault());
  const service = servicesRequestProcessors[currentService];
  let request = Soup.Message.new('GET', service.endpoint);
  service.process(httpSession, request, callback);
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
      _label.text = !responseData ? CONNECTION_REFUSED : 
                                    Settings.get_boolean('display-only-icon') ? '' :
                                    responseData.ip;

      _icon.gicon = !responseData ? Gio.icon_new_for_string(`${Me.path}/icons/flags/error.png`) : 
                                    Gio.icon_new_for_string(`${Me.path}/icons/flags/${responseData.countryCode}.png`);
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

    this.updateService = () => {
      currentService = Settings.get_string('api-service');
      this.update();
    }

    Settings.connect('changed::refresh-rate', this.updateRefreshRate.bind(this));
    Settings.connect('changed::display-only-icon', this.updateDisplayMode.bind(this));
    Settings.connect('changed::api-service', this.updateService.bind(this));
    
    this.update();
    this.updateRefreshRate();
  }

  
};

let _indicator;

const init = () => {/* Empty */};

const enable = () => _indicator = new IpInfoIndicator;

const disable = () => _indicator.destroy();
