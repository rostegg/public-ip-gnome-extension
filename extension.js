const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const DEFAULT_REFRESH_RATE = 5;
const ICON_SIZE = 16;
const NO_CONNECTION = 'Waiting for connection';
const MENU_POSITION = 'right';
const CONNECTION_REFUSED = 'Connection refused';

let _label, _icon;

const _makeRequest = (callback) => {
  let endpoint = `http://ip-api.com/json/?fields=status,countryCode,query`;


  let _httpSession = new Soup.SessionAsync();
  Soup.Session.prototype.add_feature.call(_httpSession,new Soup.ProxyResolverDefault());

  let request = Soup.Message.new('GET', endpoint);

  const _processRequest = (_httpSession,message) => {
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

const IpInfoIndicator = new Lang.Class({
  Name: 'IpInfoIndicator',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, "Ip Info Indicator", false);
    let hbox = new St.BoxLayout({style_class: 'ip-data-panel'});
    
    _icon = new St.Icon({
      gicon: Gio.icon_new_for_string(`${Me.path}/icons/flags/ad.png`),
      icon_size: ICON_SIZE
    });


    _label = new St.Label({
      text: NO_CONNECTION,
      style_class: 'ip-label'
    });
    
    hbox.add_child(_icon);
    hbox.add_child(_label);

    this.actor.add_actor(hbox);

    Main.panel.addToStatusArea('ip-info-indicator', this, 1, MENU_POSITION);

    this.update();
  },

  requestCallback: function(err, responseData) {
    if (responseData){
      let countryCode = responseData.countryCode.toLowerCase();
      let ipAddress = responseData.query;

      _label.text = ipAddress;
      _icon.gicon = Gio.icon_new_for_string(`${Me.path}/icons/flags/${countryCode}.png`);  
    } else{
      _label.text = CONNECTION_REFUSED;
    }
  },

  destroy: function() {
    this.stop();
    this.parent();
  },

  update: function(){
    _makeRequest(this.requestCallback);
    this._removeTimer();
    this.timer = Mainloop.timeout_add_seconds(DEFAULT_REFRESH_RATE, Lang.bind(this, this.update));
    return true;
  },

  _removeTimer: function () {
    if (this.timer) {
      Mainloop.source_remove(this.timer);
      this.timer = null;
    }
  },

  stop: function() {
    if (this.timer) {
      Mainloop.source_remove(this.timer);
    }
  },

});

let _indicator;

const init = () => {/* Empty */};

const enable = () => _indicator = new IpInfoIndicator;

const disable = () => _indicator.destroy();
