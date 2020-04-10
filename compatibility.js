const GObject = imports.gi.GObject;
const Config = imports.misc.config;

let shellMinorVersion = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

// https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/559
function getActor(obj) {
    if (shellMinorVersion < 34)
        return obj.actor;
    return obj;
}

// https://gitlab.gnome.org/GNOME/gjs/commit/72062b5e036821731116a9263b55ee647e3bdadf
function wrapClass(klass) {
    if (shellMinorVersion >= 36)
        return GObject.registerClass(klass);
    return klass;
}