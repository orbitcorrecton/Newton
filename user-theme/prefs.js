// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
/* exported init buildPrefsWidget */

// we use async/await here to not block the mainloop, not to parallelize
/* eslint-disable no-await-in-loop */

const {Adw, Gio, GLib, GObject, Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Util = Me.imports.util;

Gio._promisify(Gio.File.prototype, 'enumerate_children_async');
Gio._promisify(Gio.File.prototype, 'query_info_async');
Gio._promisify(Gio.FileEnumerator.prototype, 'next_files_async');

class UserThemePrefsWidget extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }
    _init() {
        super._init({title: 'Themes'});
        this.add(new OptionsGroup());
}
    constructor() {
        super({title: 'Themes'});

        this._actionGroup = new Gio.SimpleActionGroup();
        this.insert_action_group('theme', this._actionGroup);

        this._settings = ExtensionUtils.getSettings();
        this._actionGroup.add_action(
            this._settings.create_action('name'));

        this.connect('destroy', () => this._settings.run_dispose());

        this._rows = new Map();
        this._addTheme(''); // default

        this._collectThemes();
    }

    async _collectThemes() {
        for (const dirName of Util.getThemeDirs()) {
            const dir = Gio.File.new_for_path(dirName);
            for (const name of await this._enumerateDir(dir)) {
                if (this._rows.has(name))
                    continue;

                const file = dir.resolve_relative_path(
                    `${name}/gnome-shell/gnome-shell.css`);
                try {
                    await file.query_info_async(
                        Gio.FILE_ATTRIBUTE_STANDARD_NAME,
                        Gio.FileQueryInfoFlags.NONE,
                        GLib.PRIORITY_DEFAULT, null);
                    this._addTheme(name);
                } catch (e) {
                    if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                        logError(e);
                }
            }
        }

        for (const dirName of Util.getModeThemeDirs()) {
            const dir = Gio.File.new_for_path(dirName);
            for (const filename of await this._enumerateDir(dir)) {
                if (!filename.endsWith('.css'))
                    continue;

                
                if (filename.endsWith('-light.css'))
                var name = filename.slice(0, -10);
                else if (filename.endsWith('-high-contrast.css'))
                var name = filename.slice(0, -18);
                else                 
                var name = filename.slice(0, -4);
                if (!this._rows.has(name))
                    this._addTheme(name);
            }
        }
    }

    _addTheme(name) {
        const row = new ThemeRow(name);
        this._rows.set(name, row);

        this.add(row);
    }

    async _enumerateDir(dir) {
        const fileInfos = [];
        let fileEnum;

        try {
            fileEnum = await dir.enumerate_children_async(
                Gio.FILE_ATTRIBUTE_STANDARD_NAME,
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_DEFAULT, null);
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                logError(e);
            return [];
        }

        let infos;
        do {
            infos = await fileEnum.next_files_async(100,
                GLib.PRIORITY_DEFAULT, null);
            fileInfos.push(...infos);
        } while (infos.length > 0);

        return fileInfos.map(info => info.get_name());
    }
}

class ThemeRow extends Adw.ActionRow {
    static {
        GObject.registerClass(this);
    }

    constructor(name) {
        const check = new Gtk.CheckButton({
            action_name: 'theme.name',
            action_target: new GLib.Variant('s', name),
        });

        super({
            title: name || 'Default',
            activatable_widget: check,
        });
        this.add_prefix(check);
    }
}

const OptionsGroup = GObject.registerClass(
class OptionsGroup extends Adw.PreferencesGroup {
    _init() {
        super._init({ title: 'Options' });

        this.settings=ExtensionUtils.getSettings();
        
        const dlSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        this.settings.bind('default-light',
            dlSwitch, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        const dlrow = new Adw.ActionRow({
            title: 'Default Light',
            activatable_widget: dlSwitch,
        });
        
        dlrow.add_suffix(dlSwitch);
        this.add(dlrow);
        
        const dsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        this.settings.bind('darkstyle',
            dsSwitch, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        const dsrow = new Adw.ActionRow({
            title: 'Dark Mode',
            activatable_widget: dsSwitch,
        });
        
        dsrow.add_suffix(dsSwitch);
        //this.add(dsrow);
        
        const dmSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        this.settings.bind('darkmode',
            dmSwitch, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        const dmrow = new Adw.ActionRow({
            title: 'Item in Popup Menu',
            activatable_widget: dmSwitch,
        });
        
        dmrow.add_suffix(dmSwitch);
        this.add(dmrow);
    }
});

const OptionsGroup2 = GObject.registerClass(
class OptionsGroup2 extends Adw.PreferencesGroup {
    _init() {
        super._init({ title: 'Color Scheme' });

        this.settings=ExtensionUtils.getSettings();
        
        const dmSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        this.settings.bind('darkmode',
            dmSwitch, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        const dmrow = new Adw.ActionRow({
            title: 'Dark Mode',
            activatable_widget: dmSwitch,
        });
        
        dmrow.add_suffix(dmSwitch);
        //this.add(dmrow);
    }
});

/** */
function init() {
}

/**
 * @returns {Gtk.Widget} - the prefs widget
 */
function buildPrefsWidget() {
    return new UserThemePrefsWidget();
}
