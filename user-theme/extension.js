// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
// Load shell theme from ~/.local/share/themes/name/gnome-shell
/* exported init */

const {Gio, St, Clutter} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;

const Me = ExtensionUtils.getCurrentExtension();
const Util = Me.imports.util;

const SETTINGS_KEY = 'name';

var darkStyleItem = null;

class ThemeManager {
    enable() {
        this._settings = ExtensionUtils.getSettings();
        this._sysa11yiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.a11y.interface', });
        this._sysiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface', });
        
        this._changeTheme();
        this._colorschemeButton();
        if (this._settings.get_boolean('darkstyle')) 
            this._sysiSettings.set_string('color-scheme', 'prefer-dark');         
        
        this.a11ysig = this._sysa11yiSettings.connect('changed::high-contrast', () => {
            this._changeTheme();
        });
        
        this.isig = this._sysiSettings.connect('changed::color-scheme', () => {
            this._changeTheme();
            this._updatecolorschemeButton();
            if (this._settings.get_boolean('darkstyle')) 
                this._sysiSettings.set_string('color-scheme', 'prefer-dark');
        });
        this._settings.connect(`changed::${SETTINGS_KEY}`, this._changeTheme.bind(this));
        this._settings.connect(`changed::default-light`, this._changeTheme.bind(this));
        this._settings.connect(`changed::darkmode`, this._updatecolorschemeButton.bind(this));
        this._settings.connect('changed::darkstyle', () => {
        if (this._settings.get_boolean('darkstyle')) 
            this._sysiSettings.set_string('color-scheme', 'prefer-dark');
        else
            this._sysiSettings.set_string('color-scheme', 'default');
        });  
    }

    disable() {
        this._settings?.disconnectObject();
        this._settings = null;
        this._sysa11yiSettings?.disconnect(this.a11ysig);
        this._sysa11yiSettings = null;
        this._sysiSettings?.disconnect(this.isig);
        this._sysiSettings = null;

        Main.setThemeStylesheet(null);
        Main.loadTheme();
        darkStyleItem?.destroy();
        darkStyleItem = null;
    }

    _changeTheme() {
        let stylesheet = null;
        let themeName = this._settings.get_string(SETTINGS_KEY);            

        if (themeName) {
            if(this._sysa11yiSettings.get_boolean('high-contrast')) {
            this.stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-high-contrast.css`);
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'default' && this._settings.get_boolean('default-light')) {
            this.stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-light.css`);
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'prefer-light') {
            this.stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-light.css`);
            }
            else {
            this.stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell.css`);
            }
                        
            if(St.Settings.get().high_contrast) {
            this.stylesheetPaths.push(...Util.getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-high-contrast.css`));
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'default' && this._settings.get_boolean('default-light')) {
                this.stylesheetPaths.push(...Util.getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-light.css`));
            }   
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'prefer-light') {
                this.stylesheetPaths.push(...Util.getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-light.css`));
            }
            else {
                this.stylesheetPaths.push(...Util.getModeThemeDirs()                
                .map(dir => `${dir}/${themeName}.css`));
            }            
            
            stylesheet = this.stylesheetPaths.find(path => {
                let file = Gio.file_new_for_path(path);
                return file.query_exists(null);
            });            
        }

        if (stylesheet)
            global.log(`loading user theme: ${stylesheet}`);
        else
            global.log('loading default theme (Adwaita)');
        Main.setThemeStylesheet(stylesheet);
        Main.loadTheme();
    }
   
    _colorschemeButton() {
    
    darkStyleItem = new PopupMenu.PopupSubMenuMenuItem('', true, {});
    darkStyleItem.icon.icon_name = 'dark-theme';
    darkStyleItem.label.text = 'Dark Mode';
    
    if (this._sysiSettings.get_string('color-scheme') === 'prefer-dark') 
    darkStyleItem.menu.addAction('Turn Off', () => this._sysiSettings.set_string('color-scheme', 'default'), Main.panel.statusArea.aggregateMenu.menu.close());
    else
    darkStyleItem.menu.addAction('Turn On', () => this._sysiSettings.set_string('color-scheme', 'prefer-dark'), Main.panel.statusArea.aggregateMenu.menu.close());   
    
    darkStyleItem.menu.addAction('Color Settings', () => Main.extensionManager.openExtensionPrefs('user-theme', '', []));

    Main.panel.statusArea.aggregateMenu._system.menu.addMenuItem(darkStyleItem, 2);
    }
    
    _updatecolorschemeButton() {
    darkStyleItem?.destroy();
    darkStyleItem = null;
    if (this._settings.get_boolean('darkmode'))
    this._colorschemeButton();       
    }
}


/**
 * @returns {ThemeManager} - the extension state object
 */
function init() {
    return new ThemeManager();
}
