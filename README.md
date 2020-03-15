# Public IP

[![License Badge](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rostegg/email-spoofing-server/blob/master/LICENSE)
[![Download](https://img.shields.io/static/v1.svg?label=Shell:&message=3.26-3.32&color=orange)](https://extensions.gnome.org/extension/1677/public-ip/)

[<img src="https://github.com/JasonLG1979/gnome-shell-extensions-mediaplayer/blob/master/data/get-it-on-ego.svg?sanitize=true" height="100">](https://extensions.gnome.org/extension/1677/public-ip/)

# How it look?

* Normal mode 

![Example](../assets/example.png)

* Only flag mode

![Example-Flag-Mode](../assets/example-only-flag.png)

* Available settings

![Example-Settings](../assets/ext-settings.png)

* On mouseover full display

![Example-On-Mouseover](../assets/example-on-mouseover.gif)

# How to install on Arch Linux

If you are using Arch Linux feel free to use this AUR.

https://aur.archlinux.org/packages/gnome-shell-extension-public-ip-git/

```
git clone https://aur.archlinux.org/gnome-shell-extension-public-ip-git.git
cd gnome-shell-extension-public-ip-git
makepkg -sri
```

# How to install?

You can download extension from link above.

At the moment for gnome-shell >=3.36 you must use [this version of the extension](https://github.com/rostegg/public-ip-gnome-extension/tree/gnome-3.36-hotfix)

If you want install it manually, clone project to ~/.local/share/gnome-shell/extensions/public-ip-extension@rostegg.github.com folder and restart gnome desktop (Alt + F2 -> r -> Enter)

gnome-shell <=3.34:

```
git clone https://github.com/rostegg/public-ip-gnome-extension.git ~/.local/share/gnome-shell/extensions/public-ip-extension@rostegg.github.com 
```


gnome-shell >=3.36:

```
git clone -b gnome-3.36-hotfix https://github.com/rostegg/public-ip-gnome-extension.git ~/.local/share/gnome-shell/extensions/public-ip-extension@rostegg.github.com 
```

# Why 'Connection refused'?  
This may be for two reasons:
* Lack of internet connection  
* Lack of connection with the selected service (service is down, your ip was banned, etc). Now there are four services to choose from:  
  - http://ip-api.com/json/?fields=status,countryCode,query  
  - https://ipapi.co/json/  
  - https://api.myip.com  
  - https://api.ip.sb/geoip   

If you want to add own service, just create issue with link to api.

# Bug report  
For bug report provide gnome shell version (gnome-shell --version) and error message, if installation failed (Alt+F2 -> lg -> Extensions -> Show Errors).
