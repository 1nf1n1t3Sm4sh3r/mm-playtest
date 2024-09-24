class MegaMod {  
    static fetchJSON(subPath) {
        if (!subPath.startsWith('http')) subPath = `${rawPath}${subPath}`;
        return fetch(subPath)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
                return res.json();
            });
    }

    static fetchCSS(subPath) {
        if (!subPath.startsWith('http')) subPath = `${rawPath}${subPath}`;
        return fetch(subPath)
        .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
            return res.text();
        });
    }

    constructor(regexErrs, modConflicts) {
        this.regexErrs = regexErrs.filter(str => /\w+/.test(str));
        this.modConflicts = modConflicts.filter(str => /\w+/.test(str));
        this.modErrs = this.regexErrs.concat(this.modConflicts);
    }

    setModLoc() {
		Object.assign(vueData.loc, this.loc);
		vueData.loc.megaMod_betterUI_mapPopup_desc = vueData.loc.megaMod_betterUI_mapPopup_desc.format(vueData.maps.filter(m => m.availability === "both").length);
	}
    
	extractSettings(mods) {
		return mods.flatMap(mod => {
			const settings = (mod.type !== SettingType.Group) ? [mod] : [];
			if (mod.settings) settings.push(...this.extractSettings(mod.settings));
			return settings;
		});
	}

	getModSettingById(id) {
		return this.extractSettings(vueApp?.settingsUi?.modSettings || []).find(m => m.id === id);
	}

	isModSetting(id) {
		return this.getModSettingById(id) != null;
	}

	updateModSetting(id, value) {
		const setting = this.getModSettingById(id);
		if (setting) setting.value = value;
		const origSetting = this.extractSettings(vueApp.$refs.settings.originalSettings.modSettings).find(m => m.id === id);
		if (origSetting) origSetting.value = value;
		localStore.setItem(id, value);
	}

	newTogglerFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, value);
		const settingEnabled = extern.modSettingEnabled(id);
		switch (id) {
			case 'hideHUD':
				if (!value) this.hideHUD.disableHideHUD();
				vueApp.$refs.gameScreen.updateSpectateControls();
				break;
			case 'legacyMode':
				this.legacyMode.switchLegacySkins(extern.modSettingEnabled("legacyMode_skins"));
				this.legacyMode.switchLegacySounds(extern.modSettingEnabled("legacyMode_sfx"));
				break;
			case 'legacyMode_skins':
				if (extern.modSettingEnabled("legacyMode")) this.legacyMode.switchLegacySkins(value);
				break;
			case 'legacyMode_sfx':
				if (extern.modSettingEnabled("legacyMode")) {
					this.legacyMode.switchLegacySounds(settingEnabled);
					BAWK.play(settingEnabled ? "ammo_Legacy" : "ammo");
				}
				break;
			case 'changeFPS':
				if (value) {
					this.changeFPS.initFPS();
				} else {
					this.changeFPS.disableFPS();
				}
				break;
			case 'matchGrenades':
				if (extern.inGame) extern.tryUpdateGrenades();
				break;
			case 'colorSlider':
				if (!value) extern.setShellColor(0);
				else if (extern.modSettingEnabled("colorSlider_autoSave")) extern.useSliderColor();
				if (vueApp.showScreen === vueApp.screens.equip) vueApp.$refs.equipScreen.$refs.colorSelect.$forceUpdate(); // Update Color Select
				break;
			case 'colorSlider_unlock':
				if (!value && !vueApp.isUpgraded) extern.setShellColor(0);
				else if (extern.modSettingEnabled("colorSlider_autoSave")) extern.useSliderColor();
				break;
			case 'colorSlider_randomizer':
				extern.setShellColor(vueApp.equip.colorIdx);
				if (vueApp.showScreen === vueApp.screens.equip) vueApp.$refs.equipScreen.$refs.colorSelect.$forceUpdate(); // Update Color Select
				break;
			case 'betterUI':
				this.betterUI.switchBetterUI();
				break;
			case 'betterUI_ui':
				this.betterUI.switchUITweaks(settingEnabled);
				break;
			case 'betterUI_inventory':
				this.betterUI.switchBetterInv(settingEnabled);
				break;
			case 'betterUI_pfp':
			case 'betterUI_badges':
				// Update Profile Screen
				if (vueApp.showScreen === vueApp.screens.profile) {
					vueApp.$refs.homeScreen.$refs.profileScreen.$forceUpdate(); 
					vueApp.$refs.homeScreen.$refs.profileScreen.$refs.statsContainer.$forceUpdate();
				}
				break;
			case 'betterUI_roundness':
				this.betterUI.switchRoundness(settingEnabled);
				break
			case 'betterUI_colors':
				this.betterUI.switchColored(settingEnabled);
				break;
			case 'betterUI_hitMarkers':
				if (extern.inGame) extern.switchHitMarkerColor(settingEnabled);
				break;
			case 'betterUI_chat':
				this.betterUI.switchChatUpgrades(settingEnabled);
				break;
			case 'specTweaks':
			case 'specTweaks_updown':
				vueApp.$refs.gameScreen.updateSpectateControls();
				break;
			case 'themeManager':
				document.getElementById(`themeCSS-${this.getModSettingById("themeManager_themeSelect").value}`).disabled = !value;
				break;
			case 'customSkybox':
				extern.updateSkybox(
                    value, 
                    this.getModSettingById('customSkybox_colorSlider_r').value, 
                    this.getModSettingById('customSkybox_colorSlider_g').value, 
                    this.getModSettingById('customSkybox_colorSlider_b').value
                );
				break;
		}
		if (id.includes("hideHUD_")) this.hideHUD.disableHideHUD();
		if (id.includes("legacyMode_sfx_")) this.legacyMode.switchLegacySounds(extern.modSettingEnabled("legacyMode"));
		if (id.includes("betterUI_chatEvent_")) {
			const type = Object.keys(ChatEventData).find(k => ChatEventData[k].setting === id);
			this.betterUI.switchChatEvent(type, settingEnabled);
		}
		vueApp.$refs.settings.checkReloadNeeded();
	}

	newAdjusterFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, value);
		switch (id) {
			case `changeFPS_slider`:
				if (extern.modSettingEnabled("changeFPS")) this.changeFPS.setFPS(value);
				break;
		}
		if (id.includes("customSkybox_colorSlider_")) extern.updateSkybox(
			extern.modSettingEnabled("customSkybox"),
			this.getModSettingById('customSkybox_colorSlider_r').value,
			this.getModSettingById('customSkybox_colorSlider_g').value,
			this.getModSettingById('customSkybox_colorSlider_b').value
		);
	}

	newKeybindFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, value.toUpperCase());
		switch (id) {
			case "ascend":
			case "descend":
			case "toggle_freecam":
			case "hideHUD_keybind":
			case "specTweaks_freezeKeybind":
				vueApp.$refs.gameScreen.updateSpectateControls();
				break;
		}
	}

	newSelectFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, value);
        const settingEnabled = extern.modSettingEnabled(id);
		switch (id) {
			case 'themeManager_themeSelect':
				if (settingEnabled) this.customTheme.onThemeChanged(value);
				break;
			case 'customSkybox_skyboxCategorySelect':
				this.customSkybox.onSkyboxCategoryChanged(value);
				break;
			case 'customSkybox_skyboxSelect':
				extern.updateSkybox(settingEnabled);
				break;
		}
	}

    addSettingsHooks() {
        const oldLocFunc = vueApp.setLocData;
        vueApp.setLocData = function(...args) {
            oldLocFunc.apply(this, args);
            window.megaMod.setModLoc();
        };
        const { 
            onSettingToggled: oldTogglerFunc, 
            onSettingAdjusted: oldAdjusterFunc, 
            onControlCaptured: oldKeybindFunc
        } = vueApp.$refs.settings;
        Object.assign(vueApp.$refs.settings, {
            onSettingToggled(id, value) {
                oldTogglerFunc.call(this, id, value);
                window.megaMod.newTogglerFunc(id, value);
            },
            onSettingAdjusted(id, value) {
                oldAdjusterFunc.call(this, id, value);
                window.megaMod.newAdjusterFunc(id, value);
            },
            onControlCaptured(controls, id, value) {
                oldKeybindFunc.call(this, controls, id, value);
                window.megaMod.newKeybindFunc(id, value);
            },
            onSelectChanged(id, value) {
                BAWK.play("ui_onchange");
                window.megaMod.newSelectFunc(id, value);
                this.updateSettingTab();
            }
        });
    }

    addKeydownEL() {
        const hideHUDErr = ["hideHUD", "hideHUD_keybind"].some(settingId => this.modErrs.includes(settingId));
        const freezeErr = ["specTweaks", "specTweaks_freezeKeybind"].some(settingId => this.modErrs.includes(settingId));
        //const ksInfoErr = this.modErrs.includes("killstreakInfo") || this.modErrs.includes("killstreakInfo_keybind");
        document.addEventListener('keydown', (e) => {
            const modsDisabled = !(extern.modSettingEnabled("hideHUD") || extern.modSettingEnabled("killstreakInfo") || extern.modSettingEnabled("specTweaks"));
            if (document.activeElement.tagName === "INPUT" || !extern.inGame || vueApp.game.isPaused || modsDisabled) {
                if (!hideHUDErr && extern.modSettingEnabled("hideHUD")) this.hideHUD.disableHideHUD();
                /*
                if (!ksInfoErr && extern.modSettingEnabled("killstreakInfo")) {
                    // TODO: hide KSInfo Popup
                }
                */
                return;
            };
            const hideKey = window.megaMod.getModSettingById("hideHUD_keybind")?.value.toLowerCase();
            const freezeKey = window.megaMod.getModSettingById("specTweaks_freezeKeybind")?.value.toLowerCase();
            //const ksKey = this.getModSettingById("killstreakInfo_keybind")?.value.toLowerCase();
            switch (e.key.toLowerCase()) {
                case hideKey:
                    if (!hideHUDErr && extern.modSettingEnabled("hideHUD")) this.hideHUD.toggleHideHUD();
                    break;
                /*
                case ksKey:
                    // TODO: toggle KSInfo Popup
                    if (this.modErrs.includes("killstreakInfo") || this.modErrs.includes("killstreakInfo_keybind") || !extern.modSettingEnabled("killstreakInfo")) break;
                    break;
                */
                case freezeKey:
                    if (!freezeErr && extern.modSettingEnabled("specTweaks") && vueApp.ui.game.spectate) this.spectateTweaks.toggleFreezeFrame();
                    break;
            }
        });
    }

    addExternFuncs() {
        Object.assign(extern, {
            modSettingEnabled: (id, ignoreParent) => {
                const setting = this.getModSettingById(id);
                const parent = this.getModSettingById(setting?.parentId);
                return !this.regexErrs.includes(id) 
                    && (setting?.value ?? false) && (!setting?.disabled ?? false) 
                    && (ignoreParent || (parent?.value ?? true) && (!parent?.disabled ?? true));
            }
        });
    }

    addSounds(soundData) {
        const soundsInterval = setInterval(() => {
            const sounds = Object.values(BAWK?.sounds || {});
            if (!sounds.length || !sounds[0]?.buffer) return;
            clearInterval(soundsInterval);
            soundData.forEach(sfx => BAWK.loadSound(`${rawPath}/sfx/megaMod/${sfx}.mp3`, sfx));
        }, 250);
    }

    addChangelog() {
        MegaMod.fetchJSON('/data/changelog.json').then(data => vueData.changelog.megaMod = data);
        Object.assign(vueApp, {
            showChangelogPopup(megaMod = false) {
                this.changelog.megaModChangelog = megaMod;
                this.$refs.changelogPopup.show();
            },
            showMegaModTab(changelog = false) {
                if (changelog) vueApp.hideChangelogPopup();
                vueApp.showSettingsPopup();
                vueApp.$refs.settings.switchTab('mod_button');
            },
            showHistoryChangelogPopup(megaMod = false) {
                const processChangelog = (logs, target) => {
                    logs.forEach(log => {
                        const content = this.changelogSetup(log);
                        log.content.length = 0;
                        log.content.push(...content);
                        target.push(log);
                    });
                };
                
                if (megaMod) {
                    processChangelog(this.changelog.megaMod.old, this.changelog.megaMod.current);
                    this.changelog.showMegaModHistoryBtn = false;
                } else {
                    fetch('./changelog/oldChangelog.json', { cache: "no-cache" })
                        .then(response => response.json())
                        .then(data => processChangelog(data, this.changelog.current));
                    this.changelog.showHistoryBtn = false;
                }
            }
        });
    }

    setSkybox(skybox) {
        this.customSkybox.setSkybox(skybox);
    }

    addAllModFunctions() {
        this.spectateTweaks = new SpectateTweaks();
        if (!this.modErrs.includes("matchGrenades")) this.matchGrenades = new MatchGrenades();
        if (!this.modErrs.includes("killstreakInfo")) this.killstreakStats = new KillstreakStats();
        if (!this.modErrs.includes("pbSpin")) this.photoboothEggSpin = new PhotoboothEggSpin();
        if (!this.modErrs.includes("changeFPS")) this.changeFPS = new ChangeFPS();
        
        const dataFiles = [
            {  
                path: '/data/sfx', 
                callback: data => this.addSounds(data)
            },
            { 
                path: '/mods/data/legacyMode', 
                callback: data => { 
                    if (!this.modErrs.includes("legacyMode")) this.legacyMode = new LegacyMode(data); 
                } 
            },
            { 
                path: '/mods/data/hideHUD', 
                callback: data => { 
                    if (!this.modErrs.includes("hideHUD")) this.hideHUD = new HideHUD(data);
                } 
            },
            { 
                path: '/mods/data/themes', 
                callback: data => { 
                    if (!this.modErrs.includes("themeManager")) this.customTheme = new CustomTheme(data);
                } 
            },
            { 
                path: '/mods/data/skyboxes', 
                callback: data => { 
                    if (!this.modErrs.includes("customSkybox")) this.customSkybox = new CustomSkybox(data);
                } 
            },
            { 
                path: '/mods/data/inventory', 
                callback: data => { 
                    if (!this.modErrs.includes("betterUI")) this.betterUI = new BetterUI(data);
                    if (!this.modErrs.includes("colorSlider")) this.colorSlider = new ColorSlider();
                } 
            }
        ];
        Promise.all(dataFiles.map(dataFile => MegaMod.fetchJSON(`${dataFile.path}.json`))).then(results => {
            results.forEach((data, index) => { dataFiles[index].callback(data); });
        }).then(this.addKeydownEL.bind(this));
    }

    manageModErrors() {
        const checkDefined = (vars) => vars.some(variable => { 
            try { 
                return typeof eval(variable) !== 'undefined'; 
            } catch { 
                return false; 
            }
        });
    
        // Better Inventory
        const betterInvEnabled = checkDefined(["makeVueChanges", "setupItemTags", "itemData", "window.mySkins", "setMySkins", "window.randomizeSkin", "checkScriptErrors", "initBetterInventory"]);
        if (betterInvEnabled) this.modConflicts.push("betterUI");
        
        // VIP Color Slider 
        const sliderEnabled = checkDefined(["colorTemplate", "hueToHex", "hslToRgb", "rgbToHex", "updateColor", "sliderClick", "updateSliderLock"]);
        if (sliderEnabled) this.modConflicts.push("colorSlider");
    
        // Legacy Mode
        const legacyModeEnabled = checkDefined(["legacyBasicInterval", "sounds", "window.switchSounds", "legacyInitInterval"]);
        if (legacyModeEnabled) this.modConflicts.push("legacyMode");
    
        // Hide HUD
        const hideHUDEnabled = checkDefined(["elemIds", "hideHUDInterval"]);
        if (hideHUDEnabled) this.modConflicts.push("hideHUD");
    
        // Speedrun Timer
        const timerEnabled = checkDefined(["tickerStyle", "timerInitInterval"]);
        if (timerEnabled) this.modConflicts.push("killstreakInfo");

        const getModNames = (arr) => {
            const getModName = (id) => {
                const getTitleLocKey = (arr, id) => {
                    for (const obj of arr) {
                        if (obj.id === id) return obj.locKey;
                        if (obj.settings) {
                            const result = getTitleLocKey(obj.settings, id);
                            if (result) return `${obj.locKey || result}_title`;
                        }
                    }
                    return null;
                }
                const setting = this.getModSettingById(id);
                if (!setting) return id;
                return vueData.loc[(setting.settings) ? `${setting.locKey}_title` : getTitleLocKey(vueApp.settingsUi.modSettings, id)];
            };

            return [...new Set(arr.map(id => getModName(id)))];
        };
    
        if (this.regexErrs.length) {
            vueData.modErrsPopupContent = vueData.loc['megaMod_modErrsPopup_desc'].format(getModNames(this.regexErrs).join("<br>"));
            vueApp.$refs.modErrsPopup.show();
        }
        if (this.modConflicts.length) {
            vueData.disableModsPopupContent = vueData.loc['megaMod_disableModsPopup_desc'].format(getModNames(this.modConflicts).join("<br>"));
            vueApp.$refs.disableModsPopup.show();
        }
        this.modErrs = this.regexErrs.concat(this.modConflicts);
        this.extractSettings(vueApp.settingsUi.modSettings).forEach(setting => {
            const errorKey = `${setting.id}_isError`;
            const settingError = this.modErrs.includes(setting.id);
            if (settingError) {
                setting.active = false;
                if (setting.type === SettingType.Toggler) setting.value = setting.safeVal || false;
            } else if (localStore.getBoolItem(errorKey)) {
                if (setting.type === SettingType.Toggler) setting.value = setting.defaultVal;
            }
            localStore.setItem(errorKey, settingError);
        });
    }

    importLibs() {
        // Import Library for sortable tables
        document.head.appendChild(Object.assign(document.createElement('link'), { 
            rel: 'stylesheet', 
            href: `${cdnPath}/libs/sortable/sortable.min.css` 
        }));
        document.head.appendChild(Object.assign(document.createElement('script'), { 
            src: `${cdnPath}/libs/sortable/sortable.min.js`
        }));
        // GIF Library
        document.head.appendChild(Object.assign(document.createElement('script'), { 
            src: `https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js`
        }));
    }

    init(settings) {
        vueData.settingsUi.modSettings = settings;
        this.setModLoc();
        this.addChangelog();
        this.importLibs();
        this.manageModErrors();
        this.addSettingsHooks();
        vueApp.$refs.settings.initModSettings();
        const externInterval = setInterval(() => {
            if (!extern?.specialItemsTag) return;
            clearInterval(externInterval);
            this.addExternFuncs();
            this.addAllModFunctions();
        }, 250);
    }

    start() {
        // localStore Upgrades
        Object.assign(localStore, {
            // Workaround for localStorage storing bools as strings
            getBoolItem(key) {
                const value = this.getItem(key);
                return value === 'true' ? true : (value === 'false' ? false : null);
            },
            // Workaround for localStorage storing ints as strings
            getNumItem(key) {
                const value = parseFloat(this.getItem(key));
                return (!isNaN(value)) ? value : null;
            }
        });

        // Add those W MegaMod styles
        MegaMod.fetchCSS('/css/megaMod.css').then(css => document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css })));
        
        // Get loc data, get settings, init settings
        MegaMod.fetchJSON('/data/loc.json')
        .then(data => { 
            this.loc = data; 
            const megaModInitInterval = setInterval(() => {
                if (!vueApp) return;
                clearInterval(megaModInitInterval);
                MegaMod.fetchJSON('/data/settings.json').then(settings => this.init(settings));
            }, 250);
        });
    }
}

class BetterUI {   
    constructor(data) {
        Object.assign(this, data);
        this.squareIconIndexes = SOCIALMEDIA.map((icon, index) => icon.includes("-square") ? index : null).filter(index => index !== null);
        
        // Init Profile Badges
        MegaMod.fetchJSON('/mods/data/badges.json').then(data => this.initProfileBadges(data));

        Object.assign(extern, {
            isThemedItem(item, theme) {
                switch (theme.toLowerCase()) {
                    case "premium":
                    case "vip":
                    case "physical":
                    case "manual":
                    case "default":
                    case "purchase":
                    case "bundle":
                        // Nice and ez checks, W devs.
                        return item.unlock === theme.toLowerCase();
                    case "legacy":
                        return this.isThemedItem(item, "default") && item?.item_data?.meshName?.includes("_Legacy");
                    case "limited":
                        return item?.item_data?.tags?.includes("Limited");;
                    case "drops":
                        // No native "twitch" or "drops" unlock type yet :(
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.some(tag => tag.toLowerCase().includes("drops"));
                    case "notif":
                        // No native "notification" unlock type yet...probably because the notif system died :(
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes('Reward');
                    case "league":
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.some(tag => window.megaMod.betterUI.leagueTags.includes(tag.toLowerCase()));
                    case "yolker":
                        // No native "newsletter" or "ny" unlock type yet :(
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes('Newsletter');
                    case "promo":
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes(window.megaMod.betterUI.tags.promo);
                    case "event":
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes(window.megaMod.betterUI.tags.event);
                    case "social":
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes(window.megaMod.betterUI.tags.social); 
                    case "egglite":
                        return this.isThemedItem(item, "manual") && !(this.isThemedItem(item, "limited") || this.isThemedItem(item, "drops") || this.isThemedItem(item, "notif") || this.isThemedItem(item, "league") || this.isThemedItem(item, "yolker") || this.isThemedItem(item, "promo") || this.isThemedItem(item, "event") || this.isThemedItem(item, "social"));
                    case "creator":
                        const creatorTags = window.megaMod.betterUI.creatorTypes.map(type => window.megaMod.betterUI.tags.creator.format(type));
                        return item?.item_data?.tags?.some(tag => creatorTags.includes(tag));
                    case "creatoryoutube":
                        return item?.item_data?.tags?.includes(window.megaMod.betterUI.tags.creator.format(window.megaMod.betterUI.creatorTypes[4]));
                    case "creatortwitch":
                        return item?.item_data?.tags?.includes(window.megaMod.betterUI.tags.creator.format(window.megaMod.betterUI.creatorTypes[6]));
                    case "shop":
                        return this.isThemedItem(item, "purchase") && !(this.isThemedItem(item, "creator") || this.isThemedItem(item, "limited") || this.isThemedItem(item, "event"));
                }
            },
            getThemedItems(theme) {
                return [
                    ...this.catalog.hats, 
                    ...this.catalog.stamps, 
                    ...this.catalog.grenades, 
                    ...this.catalog.primaryWeapons, 
                    ...this.catalog.secondaryWeapons, 
                    ...this.catalog.melee
                ].filter(item => !theme || this.isThemedItem(item, theme));
            }
        })
        // Add needed item tags to items - hopefully this will be done natively, BWD will get around to it...eventually :)
        // Wait for specialItemsTag and catalog to be initialized
        // I could just fetch shellshock.io/data/housePromo.json to get the specialItemsTag
        const itemTagInterval = setInterval(() => {
            if (!extern?.catalog || !extern.specialItemsTag) return;
            clearInterval(itemTagInterval);

            const addTags = (add, item, tags) => {
                if (!item) return;
                tags = Array.isArray(tags) ? tags : [tags];
                tags.forEach(tag => {
                    if (add === item.item_data.tags.includes(tag)) return;
                    if (!item.item_data.tags) item.item_data.tags = [];
                    if (add) item.item_data.tags.push(tag);
                    else item.item_data.tags.splice(item.item_data.tags.indexOf(tag), 1);
                });
            };

            // Add or Remove Missing/Wrong Item Tags
            this.tagEdits.forEach(edit => addTags(edit.add, extern.catalog.findItemById(edit.id), edit.tags));

            // Set Bundle Unlock Type
            extern.getTaggedItems(this.tags.bundle).forEach(item => {
                if (!item.origUnlock) item.origUnlock = item.unlock;
                item.unlock = extern.modSettingEnabled("betterUI_inventory") ? "bundle" : item.origUnlock;
            });

            extern.catalog.findItemsByIds(extern.getActiveBundles().flatMap(x => x.itemIds)).filter(item => !["default", "purchase", "premium"].includes(item.unlock)).forEach(item => addTags(true, item, this.tags.bundle));

            // Add "Creator" and Social Type tags to Content Creator Shop Items
            this.creatorData.forEach(creator => {
                const type = this.creatorTypes[creator.type];
                extern.catalog.findItemsByIds(creator.itemIds).forEach(item => {
                    item.creatorUrl = creator.link;
                    addTags(true, item, this.tags.creator.format(type));
                })
            });

            this.promoData.forEach(promo => {
                extern.catalog.findItemsByIds(promo.itemIds).forEach(item => {
                    item.promoUrl = promo.link;
                    addTags(true, item, this.tags.promo);
                });
            });
        }, 250);

        // Better Inventory - Item Properties
        Object.assign(comp_item.computed, {
            // Bundle-Only Item Check
            isBundle() {
                return extern.isThemedItem(this.item, "bundle");
            },
            
            // Merch ("physical" unlock) Item Check
            isMerch() {
                return extern.isThemedItem(this.item, "physical");
            },

            // Twitch Drops Item Check 
            isDrops() {
                return extern.isThemedItem(this.item, "drops");
            },

            // Notification Item Check
            isNotif() {
                return extern.isThemedItem(this.item, "notif");
            },

            // League Item Check
            isLeague() {
                return extern.isThemedItem(this.item, "league");
            },

            // New Yolker Item Check
            isNewYolker() {
                return extern.isThemedItem(this.item, "yolker");
            },

            // Manual (Non-Special) Item Check
            isEgglite() {
                return extern.isThemedItem(this.item, "egglite");
            },

            // Twitch Content Creator (shop) Item Check
            isTwitchCreator() {
                return extern.isThemedItem(this.item, "creatortwitch");
            },

            // YT Content Creator (shop) Item Check
            isYTCreator() {
                return extern.isThemedItem(this.item, "creatoryoutube");
            },

            // Cross-Promotional Item Check
            isPromo() {
                return extern.isThemedItem(this.item, "promo");
            },

            // Event Item Check
            isEvent() {
                return extern.isThemedItem(this.item, "event");
            },

            // Homepage Social Item Check
            isSocial() {
                return extern.isThemedItem(this.item, "social");
            },

            // Creator Item Check
            isCreator() {
                return extern.isThemedItem(this.item, "creator");
            },

            // Normal Shop Item Check
            isNormalShop() {
                return extern.isThemedItem(this.item, "shop");
            },

            // Legacy Item Check
            isLegacy() {
                return extern.isThemedItem(this.item, "legacy");
            },

            // Banner Check
            hasBanner() {
                return this.isPremium || this.isVipItem || this.isPremiumEggPurchase ||
                        (extern.modSettingEnabled("betterUI_inventory") && (
                            this.isLimited
                            || this.isBundle
                            || this.isMerch
                            || this.isDrops
                            || this.isNotif
                            || this.isLeague
                            || this.isNewYolker
                            || this.isEgglite
                            || this.isPromo
                            || this.isEvent
                            || this.isSocial
                            || this.isCreator
                            || this.isLegacy
                        ));
            },

            // Banner Text
            bannerTxt() {
                if (!this.hasBanner) return;
                return (
                    this.isBundle ? this.loc.p_bundle_item_banner_txt :
                    (this.isPremium || this.isPremiumEggPurchase) ? this.loc.p_premium_item_banner_txt :
                    this.isVipItem ? this.loc.p_vip_item_banner_txt :
                    this.isMerch ? this.loc.p_merch_item_banner_txt :
                    this.isDrops ? this.loc.p_drops_item_banner_txt :
                    this.isNotif ? this.loc.p_notif_item_banner_txt :
                    this.isLeague ? this.loc.p_league_item_banner_txt :
                    this.isNewYolker ? this.loc.p_yolker_item_banner_txt :
                    this.isEgglite ? this.loc.p_egglite_item_banner_txt :
                    //this.isYTCreator ? this.loc.p_creatoryt_item_banner_txt :
                    //this.isTwitchCreator ? this.loc.p_creatortwitch_item_banner_txt :
                    this.isCreator ? this.loc.p_creator_item_banner_txt :
                    this.isLimited ? this.loc.p_limited_item_banner_txt :
                    this.isSocial ? this.loc.p_social_item_banner_txt :
                    this.isPromo ? this.loc.p_promo_item_banner_txt :
                    this.isEvent ? this.loc.p_event_item_banner_txt :
                    this.isLegacy ? this.loc.p_legacy_item_banner_txt :
                '');
            },

            // CSS Classes
            itemClass() {
                const invEditsEnabled = extern.modSettingEnabled("betterUI_inventory");
                return {
                    'highlight': this.isSelected,
                    'is-bundle': this.isBundle,
                    'is-premium': (this.isPremium || this.isPremiumEggPurchase),
                    'is-vip': this.isVipItem,
                    'is-merch': invEditsEnabled && this.isMerch,
                    'is-drops': invEditsEnabled && this.isDrops,
                    'is-ny': invEditsEnabled && this.isNewYolker,
                    'is-notif': invEditsEnabled && this.isNotif,
                    'is-league': invEditsEnabled && this.isLeague,
                    'is-egglite': invEditsEnabled && this.isEgglite,
                    'is-promo': invEditsEnabled && this.isPromo,
                    'is-event': invEditsEnabled && this.isEvent,
                    'is-social': invEditsEnabled && this.isSocial,
                    'is-creator-yt': invEditsEnabled && this.isYTCreator,
                    'is-creator-twitch': invEditsEnabled && this.isTwitchCreator,
                    'is-shop': invEditsEnabled && this.isNormalShop,
                    'is-legacy': invEditsEnabled && this.isLegacy,
                    'customtheme': invEditsEnabled && (this.isMerch || this.isBundle || this.isDrops || this.isNewYolker || this.isNotif || this.isLeague || this.isEgglite || this.isPromo || this.isEvent || this.isSocial || this.isCreator || this.isLegacy),
                };
            },

            // Tooltips
            tooltip() {
                if (this.showTooltip) {
                    let type = "";
                    if (extern.modSettingEnabled("betterUI_inventory")) {
                        type = [
                            this.isDrops && " drops",
                            this.isBundle && " bundle",
                            this.isLimited && " limited",
                            (this.isPremium || this.isPremiumEggPurchase) && " premium",
                            this.isVipItem && " vip",
                            this.isMerch && " merch",
                            this.isNewYolker && " ny",
                            this.isNotif && " notif",
                            this.isLeague && " league",
                            this.isEgglite && " egglite",
                            this.isPromo && " promo",
                            this.isEvent && " event",
                            this.isSocial && " social",
                            this.isYTCreator && " ytcc",
                            this.isTwitchCreator && " twitchcc",
                            this.isLegacy && " legacy"
                        ].find(Boolean) || "";
                    }
                    return 'tool-tip' + type;
                }
            },

            // Icon Check
            hasIcon() {
                return this.isBundle || vueApp.currentEquipMode === vueApp.equipMode.inventory && (
                    this.isPremium
                    || this.isPremiumEggPurchase
                    || this.isLeague
                    || this.isEgglite
                    || this.isLimited
                    || this.isDrops
                    || this.isNotif
                    || this.isMerch
                    || this.isCreator
                    || this.isNewYolker
                    || this.isPromo
                    || this.isEvent
                    || this.isSocial
                    /*|| this.isNormalShop*/
                    || this.isLegacy
                );
            },

            // Icon CSS Class
            iconClass() {
                if (!this.hasIcon) return;
                return this.isBundle ? 'fas fa-box-open hover' :
                    this.isPremium ? 'fas fa-dollar-sign hover' :
                    this.isMerch ? 'fas fa-tshirt hover' :
                    this.isDrops ? 'fab fa-twitch hover' :
                    this.isNotif ? 'fas fa-bell hover' :
                    this.isLeague ? 'fas fa-trophy' :
                    this.isNewYolker ? 'fas fa-envelope-open-text hover' :
                    this.isEgglite ? 'fas6 fa-sparkles' :
                    this.isYTCreator ? 'fab fa-youtube hover' :
                    this.isTwitchCreator ? 'fab fa-twitch hover' :
                    this.isLimited ? 'far fa-gem hover' :
                    this.isSocial ? 'fas fa-share' :
                    this.isPromo ? 'fas fa-ad hover' :
                    this.isEvent ? 'fas fa-calendar-alt' :
                    (this.isNormalShop || this.isPremiumEggPurchase) ? 'fas fa-egg' :
                    this.isLegacy ? 'fas6 fa-history' :
                '';
            },

            // Icon Hover 
            iconHover() {
                if (this.isVipItem || this.iconClass.includes("hover")) return () => { /*BAWK.play("ui_chicken");*/ };
                return () => {};
            },

            // Icon Click
            iconClick() {
                const addClickSFX = (func) => () => {
                    BAWK.play("ui_equip");
                    func();
                };
                if (this.isPremium || this.isBundle) return () => { vueApp.openEquipSwitchTo(vueApp.equipMode.shop) };
                if (this.isPremiumEggPurchase) return () => { vueApp.openEquipSwitchTo(vueApp.equipMode.skins) };
                if (this.isMerch) return addClickSFX(() => { window.open('https://bluewizard.threadless.com/') });
                if (this.isVipItem) return vueApp.showSubStorePopup;
                if (this.isDrops) return addClickSFX(() => { window.open((dynamicContentPrefix || '') + 'twitch') });
                if (this.isNotif) return addClickSFX(() => { Notification.requestPermission() });
                if (this.isNewYolker) return addClickSFX(() => { window.open('https://bluewizard.com/subscribe-to-the-new-yolker/') });
                if (this.item.creatorUrl && this.isCreator) return addClickSFX(() => { window.open(`https://${this.item.creatorUrl}`) });
                if (this.item.promoUrl && this.isPromo) return addClickSFX(() => { window.open(`https://${this.item.promoUrl}`) });
                if (this.isLimited) return () => {
                    vueApp.openEquipSwitchTo(vueApp.equipMode.featured);
                    vueApp.equip.showingItems = extern.getTaggedItems(extern.specialItemsTag).filter(item => item.is_available && extern.isItemOwned(item));
                };
                return () => {};
            }
        });

        // Better Inventory - Modify Item Sorting (Order)
        // Premium --> VIP --> Bundle --> Merch --> Drops --> Yolker --> League --> Notif --> Egglite --> Promo --> Event --> Social --> Default/Legacy --> Limited --> Creator --> Shop
        comp_item_grid.computed.itemsSorted = function() {
            const compareThemedItem = (a, b, theme) => extern.isThemedItem(a, theme) - extern.isThemedItem(b, theme);
            const invEditsEnabled = extern.modSettingEnabled("betterUI_inventory");
            return this.items.sort((b, a) => {
                for (const theme of window.megaMod.betterUI.themeOrder) {
                    const result = compareThemedItem(a, b, theme.theme) * (!theme.custom || invEditsEnabled);
                    if (result !== 0) return result;
                }
                return 0;
            });
        };

        // Challenge Claim SFX
        const oldChallengeClaim = extern.playerChallenges.claim;
        extern.playerChallenges.claim = function(...args) {
            oldChallengeClaim.apply(this, args);
            if (extern.modSettingEnabled("betterUI_ui")) BAWK.play("challenge_notify");
        }

        // Weapon Deselect Bug
        const oldSelectItem = vueApp.$refs.equipScreen.selectItem;
        vueApp.$refs.equipScreen.selectItem = function(item) {
            if (!item) return;
            const selectingSame = hasValue(this.equip.selectedItem) && this.equip.selectedItem.id === item.id;
            const isWeapon = ![ItemType.Hat, ItemType.Stamp].includes(item.item_type_id);
            if (extern.modSettingEnabled("betterUI_inventory") && selectingSame && isWeapon) {
                this.selectItemClickSound(item);
                return;
            }
            oldSelectItem.call(this, item);
        };

        // Item Totals
        vueApp.getShowingItemTotal = function() {
            let resItems = [];
            if (this.currentEquipMode === this.equipMode.featured) {
                // # of currently purchasable limited items
                resItems = extern.getTaggedItems(extern.specialItemsTag).filter(item => item.is_available);
            } else {
                resItems = extern.getItemsOfType(this.equip.selectedItemType);
            }
            if (![this.equipMode.inventory, this.equipMode.featured].includes(this.currentEquipMode)) {
                // # of owned shop items (eggs + premium) in the weapon category
                resItems = resItems.filter(item => extern.isItemOwned(item) && ["purchase", "premium"].includes(item.unlock));
            }
            return resItems.length || "???";
        };

        const playerAccount = extern.account.constructor;
        const { signedIn: oldSignedIn, loggedOut: oldLoggedOut } = playerAccount.prototype;
        Object.assign(playerAccount.prototype, {
            signedIn(...args) {
                oldSignedIn.apply(this, args);
                vueApp.equip.updateShowingItemTotal();
            },
            loggedOut(...args) {
                oldLoggedOut.apply(this, args);
                vueApp.equip.updateShowingItemTotal();
            }
        });

        const addStyle = (name) => {
            const preload = extern.modSettingEnabled("megaMod_cssPreload");
            const url = `/mods/css/${name}.css`;
            const style = document.createElement(preload ? 'style' : 'link');
            document.head.appendChild(style);
            if (preload) {
                MegaMod.fetchCSS(rawPath + url).then(css => style.textContent = css);
            } else {
                Object.assign(style, { rel: 'stylesheet', href: (cdnPath + url) });
            }
            return style;
        };
        // Add CSS
        Promise.all([
            addStyle('ui'),
            addStyle('inventory'),
            addStyle('roundness'),
            addStyle('colors'),
            addStyle('chat')
        ]).then(styles => {
            const [UITweaksStyle, betterInvStyle, roundnessStyle, coloredStyle, chatUpgradeStyle] = styles;
            Object.assign(this, { UITweaksStyle, betterInvStyle, roundnessStyle, coloredStyle, chatUpgradeStyle });
            this.switchBetterUI(true);
        });
    }

    initProfileBadges(badgeData) {
        this.badgeData = badgeData;
        const oldSwitchToProfileUi = vueApp.switchToProfileUi;
        Object.assign(vueApp, {
            separateRows(badges) {
                const badgesPerRow = window.megaMod.betterUI.badgeData.badgesPerRow;
                const rows = [];
                let mainIndex = 0;
                let tierIndex = 0;
                
                const createRow = (numBadges) => {
                    const row = { main: [], tier: [] };
                    while (row.main.length + row.tier.length < numBadges && (mainIndex < badges.main.length || tierIndex < badges.tier.length)) {
                        if (mainIndex < badges.main.length && row.main.length + row.tier.length < numBadges) 
                            row.main.push(badges.main[mainIndex++]);
                        if (tierIndex < badges.tier.length && row.main.length + row.tier.length < numBadges) 
                            row.tier.push(badges.tier[tierIndex++]);
                    }
                    return row;
                };
                
                rows.push(createRow(badgesPerRow - 2));
                while (mainIndex < badges.main.length || tierIndex < badges.tier.length) rows.push(createRow(badgesPerRow));
                return rows;
            },
            getBadges(info = false) {
                const mainBadges = [];
                const tierBadges = [];
                const badgeMap = new Map();
                const addBadge = (tier, title, classList, clickFunc, desc) => (tier ? tierBadges : mainBadges).push({ title, classList, clickFunc, desc });
                const numeral = num => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][num - 1] || num;
                const formatValue = value => value % 1 === 0 ? value.toLocaleString() : value.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                const { types, badges } = window.megaMod.betterUI.badgeData;
                const setupBadge = (badge, index) => {
                    if (index != null) badge.tier = index + 1;
                    const data = types[badge.type] || {};
                    
                    const tierLocKeys = data.tierLocKeys || badge.tierLocKeys;
                    const locKey = (tierLocKeys && badge.tier) ? tierLocKeys[index] : (data.locKey || badge.locKey);
                    const titleLocKey = `${locKey}_title`;
                    
                    const tierIcons = data.tierIcons || badge.tierIcons;
                    const icon = (tierIcons && badge.tier) ? tierIcons[index] : (data.icon || badge.icon);
                    
                    const oldClickFunc = eval(data.clickFunc || badge.clickFunc || 'null');
                    const clickFunc = oldClickFunc ? () => { BAWK.play("ui_click"); oldClickFunc(); } : () => {};
                    
                    if (data.class) badge.class += data.class;
                    if (badge.tier) badge.class += ` tier${badge.tier}`;
                    if (oldClickFunc) badge.class += ' badge-hover';
                    
                    const condition = `${data.condition || ''}${badge.condition || ''}`.format(badge.value || '');
                    if (info || eval(condition)) {
                        const mapKey = `${locKey}${info && badge.tier ? badge.tier : ''}`;
                        const newBadge = { 
                            ...badge, icon, clickFunc, 
                            titleLocKey: (this.loc[titleLocKey] || '').format(numeral(badge.tier), badge.value) 
                        };
    
                        if (badge.tier) {
                            const existingBadge = badgeMap.get(mapKey);
                            if (info || (!existingBadge || badge.tier > existingBadge.tier)) 
                                badgeMap.set(mapKey, newBadge);
                        } else 
                            badgeMap.set(mapKey, newBadge);
                        
                        if (info) {
                            badge.precision = data.precision || badge.precision;
                            badge.ignorePlus = data.ignorePlus || badge.ignorePlus;
                            if (badge.precision) badge.value = badge.value.toFixed(badge.precision);
                            let value = badge.value ? formatValue(badge.value) : '';
                            if (!badge.ignorePlus && badge?.tier === badge?.tierValues?.length) value += "+";
                            const badgeObj = badgeMap.get(mapKey);
                            badgeObj.desc = (this.loc[`${locKey}_desc`] || '');
                            badgeObj.desc = badgeObj.desc
                                .format((badgeObj.value === 1 && badgeObj.desc.includes("{s}")) ? "a" : value)
                                .replace("{over}", (badgeObj?.tier === badge?.tierValues?.length && badgeObj.value !== 100) ? "over " : "")
                                .replace("{s}", badgeObj.value === 1 ? "" : "s");
                        }
                    }
                };
                
                badges.forEach(badge => {
                    if (badge.tierValues) 
                        badge.tierValues.forEach((value, i) => setupBadge({ ...badge, value }, i));
                    else 
                        setupBadge(badge);
                });
                badgeMap.forEach(badge => addBadge(badge.tier != null, badge.titleLocKey, `${badge.icon} ${badge.class}`, badge.clickFunc, badge.desc));
                
                const returnData = { main: mainBadges, tier: tierBadges };
                return info ? returnData : { rows: this.separateRows(returnData).map(({ main, tier }) => ({ main, tier })) };
            },
            getBadgeInfo() {
                return this.getBadges(true);
            },
            showBadgeInfo() {
                BAWK.play("ui_popupopen");
                vueApp.$refs.badgeInfoPopup.show();
            },
            switchToProfileUi() {
                oldSwitchToProfileUi.call(this);
                this.updateBadges();
            }
        });
        vueApp.badgeInfo = vueApp.getBadges(true);

        const playerAccount = extern.account.constructor;
        const { 
            signedIn: oldSignedIn, 
            loggedOut: oldLoggedOut, 
            setStats: oldSetStats, 
            addToInventory: oldAddToInventory 
        } = playerAccount.prototype;
        Object.assign(playerAccount.prototype, {
            signedIn(...args) {
                oldSignedIn.apply(this, args);
                vueApp.updateBadges();
            },
            loggedOut(...args) {
                oldLoggedOut.apply(this, args);
                vueApp.updateBadges();
            },
            setStats(...args) {
                oldSetStats.apply(this, args);
                vueApp.updateBadges();
            },
            addToInventory(...args) {
                oldAddToInventory.apply(this, args);
                vueApp.updateBadges();
            }
        });
    }

    randomizeSkin() {
        const randomItems = {};
        Object.values(ItemType).forEach(type => {
            const typeItems = extern.getItemsOfType(type).filter(item => item.unlock === "default" || extern.isItemOwned(item));
            randomItems[type] = typeItems[Math.floor(Math.random() * typeItems.length)];
        });

        vueData.equip.selectedItem = randomItems[vueApp.equip.selectedItemType];
        Object.values(randomItems).filter(item => item != null).forEach(item => extern.tryEquipItem(item));
        extern.poseWithItems(randomItems);
        //extern.setShellColor(Math.floor(Math.random() * (extern.account.isUpgraded() ? 14 : 7)));
        vueApp.$refs.equipScreen.updateEquippedItems();
        vueApp.$refs.equipScreen.moveStamp(
            Math.floor(Math.random() * 25) - 12, // -12 to 12 inclusive
            Math.floor(Math.random() * 33) - 15 // -15 to 17 inclusive
        );
        vueApp.$refs.equipScreen.renderStamp();
        BAWK.play("ui_equip");
    }

    switchUITweaks(enabled) {
        this.UITweaksStyle.disabled = !enabled;
        this.squareIconIndexes.forEach(i => {
            if (enabled) {
                SOCIALMEDIA[i] = SOCIALMEDIA[i].replace("-square", "");
            } else {
                SOCIALMEDIA[i] += (!SOCIALMEDIA[i].includes("-square")) ? "-square" : "";
            }
        });
        vueApp.ui.socialMedia.footer[vueApp.ui.socialMedia.footer.map(elem => elem.icon).findIndex(icon => icon.includes("fa-steam"))].icon = (enabled) ? "fa-steam" : "fa-steam-symbol";
        if (vueApp.showScreen === vueApp.screens.home) vueApp.$refs.homeScreen.$refs.playPanel.$forceUpdate(); // Update Play Buttons
    }

    switchRoundness(enabled) {
        this.roundnessStyle.disabled = !enabled;
    }

    switchColored(enabled) {
        this.coloredStyle.disabled = !enabled;
    }

    switchBetterInv(enabled, init) {
        // Add/Remove "Limited" tag to Monthly Featured Items
        extern.getTaggedItems(extern.specialItemsTag).filter(item => item.is_available).forEach(item => {
            if (!Array.isArray(item?.item_data?.tags)) item.item_data.tags = [];
            if (!enabled && item.item_data.tags.includes("Limited")) {
                item.item_data.tags.splice(item.item_data.tags.indexOf("Limited"), 1);
            } else if (enabled && item.is_available && item.item_data.tags.indexOf("Limited") === -1) {
                item.item_data.tags.push("Limited");
            }
        });

        // Set Bundle Unlock Type
        extern.getTaggedItems(this.tags.bundle).forEach(item => {
            if (!item.origUnlock) item.origUnlock = item.unlock;
            item.unlock = enabled ? "bundle" : item.origUnlock;
        });

        this.betterInvStyle.disabled = !enabled;
        if (init) return;
        if ([vueApp.equipMode.inventory, null].includes(vueApp.currentEquipMode) && vueApp.game.isPaused) {
            [null, vueApp.equip.selectedItemType].forEach(type => setTimeout(vueApp.$refs.equipScreen.populateItemGridWithType, 0, type));
        }
    }

    adjustChatLength() {
        const chatItems = Array.from(document.getElementById("chatOut").querySelectorAll(".chat-item"));
        chatItems.slice(0, Math.max(0, chatItems.length - 5)).forEach(item => item.remove());
    }

    switchChatUpgrades(enabled) {
        this.chatUpgradeStyle.disabled = !enabled;
        if (!enabled) this.adjustChatLength();
        Object.entries(ChatEventData).forEach(([type, v]) => this.switchChatEvent(type, extern.modSettingEnabled(v.setting)));
    }

    switchChatEvent(type, enabled) {
        const chatItems = Array.from(document.getElementById("chatOut").querySelectorAll(`.chat-item.type-${type}`));
        chatItems.forEach(item => item.style.setProperty("display", enabled ? "" : "none", 'important'));
        this.adjustChatLength();
    }

    switchBetterUI(init) {
        if (extern.inGame) extern.switchHitMarkerColor(extern.modSettingEnabled("betterUI_hitMarkers"));
        this.switchUITweaks(extern.modSettingEnabled("betterUI_ui"));
        this.switchBetterInv(extern.modSettingEnabled("betterUI_inventory"), init);
        if (vueApp.showScreen === vueApp.screens.profile) vueApp.$refs.homeScreen.$refs.profileScreen.$forceUpdate(); // Update Profile Screen
        if (vueApp.showScreen === vueApp.screens.equip) vueApp.$refs.equipScreen.$refs.colorSelect.$forceUpdate(); // Update Color Select
        this.switchRoundness(extern.modSettingEnabled("betterUI_roundness"));
        this.switchColored(extern.modSettingEnabled("betterUI_colors"));
        this.switchChatUpgrades(extern.modSettingEnabled("betterUI_chat"));
    }
}

class ColorSlider {   
    constructor() {
        window.shellColors[14] = localStore.getItem('colorSlider_hex') || "#00FFFF";
        const oldSetColor = extern.setShellColor;
        Object.assign(extern, {
            useSliderColor() {
                const sub = extern.account.isSubscriber;
                extern.account.isSubscriber = true;
                extern.setShellColor(14);
                extern.account.isSubscriber = sub;
            },
            setSliderColor(hex) {
                shellColors[14] = hex;
                this.useSliderColor();
            },
            usingSlider() {
                return this.modSettingEnabled("colorSlider_unlock") || vueApp.isUpgraded;
            },
            setShellColor(colorIdx) {
                document.documentElement.style.setProperty('--slider-accent-color', `var(${(this.usingSlider() && colorIdx == 14) ? "--ss-white" : "--ss-blue3"})`);
                oldSetColor.call(this, colorIdx);
            }
        });
        const playerAccount = extern.account.constructor;
        const oldSignedIn = playerAccount.prototype.signedIn;
        playerAccount.prototype.signedIn = function(...args) {
            oldSignedIn.apply(this, args);
            if (extern.usingSlider() && extern.modSettingEnabled("colorSlider_autoSave")) extern.useSliderColor();
        }
    }
}

class LegacyMode {   
    static itemIds = [3000, 3100, 3400, 3600, 3800, 4000, 4200];

    constructor(legacySounds) {
        this.legacySounds = legacySounds;
        const soundsInterval = setInterval(() => {
            const sounds = Object.values(BAWK?.sounds || {});
            if (!sounds.length || !sounds[0]?.buffer) return;
            clearInterval(soundsInterval);
            Promise.all(this.getAllLegacySounds().map(s => {
                BAWK.sounds[`${s}_Default`] = BAWK.sounds[s];
                return BAWK.loadSound(`${rawPath}/sfx/legacy/${s}.mp3`, `${s}_Legacy`);
            })).then(() => {
                if (extern.modSettingEnabled("legacyMode")) this.switchLegacySounds(extern.modSettingEnabled("legacyMode_sfx"));
            });
        }, 250);
    
        const skinsInterval = setInterval(() => {
            if (extern.account && extern.account.colorIdx == null) return;
            clearInterval(skinsInterval);
            vueApp.$refs.equipScreen.equipped = extern.account.getEquippedItems();
            if (extern.modSettingEnabled("legacyMode")) this.switchLegacySkins(extern.modSettingEnabled("legacyMode_skins"));
        }, 250);
    }

    getAllLegacySounds(obj = this.legacySounds) {
        const values = [];
        for (const key in obj) {
            if (Array.isArray(obj[key])) values.push(...obj[key]);
            else if (typeof obj[key] === 'object') values.push(...this.getAllLegacySounds(obj[key]));
        }
        return values;
    }

    switchLegacySounds(enabled) {
        this.getAllLegacySounds().forEach(s => {
            const sound = BAWK.sounds[s];
            const defaultSound = BAWK.sounds[`${s}_Default`];
            if (sound.buffer.duration === defaultSound.buffer.duration && sound.buffer.length === defaultSound.buffer.length) return;
            BAWK.sounds[s] = defaultSound;
        });

        const settingsPrefix = "legacyMode_sfx_";
        const selectedSounds = [];
        ["cluck9mm", "eggk47", "dozenGauge", "csg1", "rpegg", "smg", "m24"].forEach(gun => {
            const gunPrefix = settingsPrefix + gun;
            if (enabled && extern.modSettingEnabled(`${gunPrefix}_defaultonly`)) {
                BAWK.sounds[`gun_${gun}_Legacy_fire`] = BAWK.sounds[`gun_${gun}_fire_Legacy`];
            } else {
                delete BAWK.sounds[`gun_${gun}_Legacy_fire`];
            }
            if (!(enabled && extern.modSettingEnabled(`${gunPrefix}_enabled`))) return;
            if (extern.modSettingEnabled(`${gunPrefix}_fire`) && !extern.modSettingEnabled(`${gunPrefix}_defaultonly`)) selectedSounds.push(...this.legacySounds.guns[`gun_${gun}`].fire);
            if (extern.modSettingEnabled(`${gunPrefix}_reload`)) selectedSounds.push(...this.legacySounds.guns[`gun_${gun}`].reload);
        });

        if (enabled && extern.modSettingEnabled(`${settingsPrefix}gexplode`) && extern.modSettingEnabled(`${settingsPrefix}defaultgexplode`)) {
            extern.catalog.findItemById(16000).item_data.sound = "grenade_Legacy";
        } else {
            delete extern.catalog.findItemById(16000).item_data.sound;
        }
        if (!enabled) return;
        if (extern.modSettingEnabled(`${settingsPrefix}pickup`)) selectedSounds.push(...this.legacySounds.pickup);
        if (extern.modSettingEnabled(`${settingsPrefix}swap`)) selectedSounds.push(...this.legacySounds.weapon_swap);
        if (extern.modSettingEnabled(`${settingsPrefix}gbeep`)) selectedSounds.push(...this.legacySounds.grenade_beep);
        if (extern.modSettingEnabled(`${settingsPrefix}gthrow`)) selectedSounds.push(...this.legacySounds.grenade_pin);
        if (extern.modSettingEnabled(`${settingsPrefix}gexplode`) && !extern.modSettingEnabled(`${settingsPrefix}defaultgexplode`)) selectedSounds.push(...this.legacySounds.grenade);
        
        selectedSounds.forEach(s => {
            const sound = BAWK.sounds[s];
            const typeSound = BAWK.sounds[`${s}_${enabled ? 'Legacy' : 'Default'}`];
            if (sound.buffer.duration === typeSound.buffer.duration && sound.buffer.length === typeSound.buffer.length) return;
            BAWK.sounds[s] = typeSound;
        });
    }
    
    switchLegacySkins(enabled) {
        extern.catalog.findItemsByIds(LegacyMode.itemIds).forEach(item => {
            item.name = (enabled) ? item.name.replace(" ", " Legacy ") : item.name.replace(" Legacy ", " ");
            const meshName = item.item_data.meshName;
            if (enabled) {
                itemRenderer.meshRenderStaging[`${meshName}_Legacy`] = itemRenderer.meshRenderStaging[meshName];
                item.item_data.meshName += (!meshName.includes("_Legacy")) ? "_Legacy" : "";
            } else {
                itemRenderer.meshRenderStaging[meshName.replace("_Legacy", "")] = itemRenderer.meshRenderStaging[meshName];
                item.item_data.meshName = item.item_data.meshName.replace("_Legacy", "");
            }
        });
        if (extern.inGame) extern.updateLegacySkinsInGame(enabled);
        const origItems = vueApp.$refs.equipScreen.equip.showingItems;
        // POV: too lazy to think of something better :D
        if (vueApp.currentEquipMode === vueApp.equipMode.inventory) {
            vueApp.$refs.equipScreen.equip.showingItems = origItems.map(_ => extern.getItemsOfType(ItemType.Hat)[0]);
            setTimeout(() => { vueApp.$refs.equipScreen.equip.showingItems = origItems; }, 0);
        }

        if ((vueApp.currentEquipMode === vueApp.equipMode.inventory || vueApp.currentEquipMode == null) && vueApp.game.isPaused) {
            [ItemType['Melee'], ItemType['Grenade'], vueApp.equip.selectedItemType].forEach(type => {
                vueApp.equip.showingWeaponType = type;
                vueApp.$refs.equipScreen.poseEquippedItems();
            });
        }
    }

    selectedLegacyGun(gun) {
        return gun === window.megaMod.getModSettingById('legacyMode_weaponSelect').value;
    }

    legacyDefaultOnly(item) {
        const gun = item.item_data.meshName.split("_")[1];
        return  item.unlock === "default" && extern.catalog.findItemsByIds(LegacyMode.itemIds).map(i => i.item_data.meshName.split("_")[1]).includes(gun) && extern.modSettingEnabled('legacyMode_sfx') && extern.modSettingEnabled(`legacyMode_sfx_${gun}_enabled`) && extern.modSettingEnabled(`legacyMode_sfx_${gun}_defaultonly`);
    }
}

class HideHUD {   
    constructor(hudElemIds) {
        this.hudElemIds = hudElemIds;
        this.hudHidden = false;
        vueApp.$refs.gameScreen.updateSpectateControls();
    }
    
    getHUDElems() {
        return [
            ...Object.entries(this.hudElemIds)
                .filter(([id, _]) => !this.hudHidden || extern.modSettingEnabled(`hideHUD_${id}`))
                .flatMap(([_, ids]) => ids)
        ];
    }

    toggleHideHUD(disable) {
        this.hudHidden = disable ? false : !this.hudHidden;
        this.updateHUDVisibility();
    }

    disableHideHUD() {
        this.toggleHideHUD(true);
    }

    updateHUDVisibility() {
        this.getHUDElems().map(id => document.getElementById(id)).filter(Boolean).forEach(e => e.style.opacity = this.hudHidden ? 0 : 1);
        if (!this.hudHidden || extern.modSettingEnabled("hideHUD_nametags")) extern.hideNametags(this.hudHidden);
        if (!this.hudHidden || extern.modSettingEnabled("hideHUD_outlines")) extern.hideOutlines(this.hudHidden);
        if (extern.inGame && (!this.hudHidden || extern.modSettingEnabled("hideHUD_pickups"))) extern.hidePickups(this.hudHidden);
    }
}

class KillstreakStats {   
    constructor() {
        const oldRespawn = extern.respawn;
        extern.respawn = () => {
            oldRespawn.call(this);
            this.startTimer();
        };
    }

    startTimer() {
        const timer = document.getElementById("playTimer");
        if (!(extern.modSettingEnabled("killstreakInfo") && timer && document.getElementById("healthHp"))) return;
        const startTime = new Date().getTime();
        const timerInterval = setInterval(() => {
            if (vueApp.game.respawnTime) {
                clearInterval(timerInterval);
                return;
            }
            const elapsedTime = (new Date().getTime() - startTime) / 1000;
            const minutes = Math.floor(elapsedTime / 60);
            const hours = Math.floor(minutes / 60);
            timer.innerHTML = `${(hours > 0 ? String(hours).padStart(hours > 10 ? 2 : 1, "0") + ":" : "") + (minutes % 60).toString().padStart(minutes > 10 ? 2 : 1, "0")}:${(elapsedTime % 60).toFixed(3).padStart(6, "0")}`;
        }, 1);
    }
}

class MatchGrenades {   
    constructor() {
        const oldPause = vueApp.setPause;
        vueApp.setPause = function(...args) {
            oldPause.apply(this, args);
            extern.tryUpdateGrenades();
            vueData.ui.game.spectatingPlayerName = null;
        };
    }
}

class ChangeFPS {   
    constructor() {
        // TODO: Make this mod actually work properly and be less glitchy! >:)
        this.animCallbacks = [];
        this.oldRAF = window.requestAnimationFrame;
        this.newRAF = (cb) => this.animCallbacks.push(cb);

        // Set FPS Default Value
        /*
        // This is too buggy
        (() => {
            return new Promise((resolve) => {
                const frameTimes = [];
                let lastFrameTime = performance.now();
                function frame(time) {
                    const delta = time - lastFrameTime;
                    lastFrameTime = time;
                    frameTimes.push(delta);
                    if (frameTimes.length > 60) {
                        frameTimes.shift();
                        resolve(Math.round(1000 / (frameTimes.reduce((a, b) => a + b) / frameTimes.length)));
                        return;
                    }
                    requestAnimationFrame(frame);
                }
                requestAnimationFrame(frame);
            });
        })().then(fps => {
            const setting = window.megaMod.getModSettingById("changeFPS_slider");
            //setting.defaultVal = Math.round(itemRenderer.scene._engine._fps);
            setting.defaultVal = fps;
            this.initFPS();
        });
        */ 
        if (extern.modSettingEnabled("changeFPS")) this.initFPS();
    }

    initFPS() {
        this.enableFPS();
        this.setFPS(window.megaMod.getModSettingById("changeFPS_slider").value);
    }

    setFPS(fps) {
        if (this.fpsChangeInterval) clearInterval(this.fpsChangeInterval);
        this.fpsChangeInterval = setInterval(() => {
            const callbacks = [...this.animCallbacks];
            this.animCallbacks.length = 0;
            callbacks.forEach(f => f(document.timeline.currentTime));
        }, 1000 / fps);
    }

    enableFPS() { 
        window.requestAnimationFrame = this.newRAF; 
    }

    disableFPS() {
        window.requestAnimationFrame = this.oldRAF; 
    }
}

class SpectateTweaks {   
    constructor() {
        this.freezeFrame = false;
        extern.getSpecSpeed = () => extern.modSettingEnabled("specTweaks") ? (window.megaMod.getModSettingById("specTweaks_speedSlider").value / 100) : 1;
    }

    toggleFreezeFrame() {
        extern.freezeFrame(this.freezeFrame = !this.freezeFrame);
        if (this.freezeFrame) {
            if (this.freezeInterval) clearInterval(this.freezeInterval);
            this.freezeInterval = setInterval(() => {
                if (vueApp.ui.game.spectate) return;
                clearInterval(this.freezeInterval);
                extern.freezeFrame(this.freezeFrame = false);
            }, 100);
        }
    }
}

class PhotoboothEggSpin {   
    constructor() {

    }

    setupGIF() {
        const workerScript = `
            self.onmessage = function (event) {
                importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
                self.onmessage = null;
                self.postMessage(event.data);
            };
        `;
        const workerURL = URL.createObjectURL(new Blob([workerScript], { type: 'application/javascript' }));
        
        this.pbSpinGif = new GIF({
            workers: 8,
            quality: 10,
            debug: true,
            workerScript: workerURL
        });
        this.pbSpinGif.on('finished', function(blob) {
            // Create an image element to display the GIF
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            document.body.appendChild(img);
            
            // Optionally, you can create a download link
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'spin.gif';
            document.body.appendChild(link);
            link.click();
            console.log("DONE WITH IMAGE!");
            window.open(URL.createObjectURL(blob));
        });
    }

    captureFrame(delay, lastFrame) {
        const canvasCtx = document.createElement("canvas").getContext("2d");
        const settings = { allowTaint: false, logging: false, backgroundColor: null };
        const innerWidth = window.innerWidth;
        const halfWidth = innerWidth / 2;
        const innerHeight = window.innerHeight;
        
        html2canvas(document.body, settings).then(res => {
            const noBg = !vueApp.$refs.photoBooth._data.bgIdx;
            if (noBg) {
                if (!this.pbSpinGif.options.transparent) this.pbSpinGif.options.transparent = true;
                canvasCtx.canvas.width = halfWidth;
                canvasCtx.canvas.height = innerHeight;
                canvasCtx.drawImage(res, -Math.max(0, (innerWidth - halfWidth) / 2 || 0), -(+canvasCtx.y || 0));
            }
            this.pbSpinGif.addFrame(noBg ? canvasCtx.canvas : res, { delay });
            if (lastFrame) this.pbSpinGif.render();
        });
    }
}

class CustomTheme {   
    constructor(themes) {
        this.themes = themes;
        this.themes.forEach(theme => {
            theme.url = theme.url || `/themes/css/${theme.id}.css`;
            const preload = extern.modSettingEnabled("themeManager_preload", true);
            const style = document.createElement(preload ? 'style' : 'link');
            style.id = `themeCSS-${theme.id}`;
            const disabled = !(extern.modSettingEnabled("themeManager") && theme.id === window.megaMod.getModSettingById("themeManager_themeSelect").value);
            if (preload) {
                MegaMod.fetchCSS(rawPath + theme.url)
                    .then(css => {
                        document.head.appendChild(style).textContent = css;
                        style.disabled = disabled;
                    });
            } else {
                Object.assign(style, { rel: 'stylesheet', href: (cdnPath + theme.url), disabled: disabled });
                document.head.appendChild(style);
            }
        });
    }

    onThemeChanged(themeId) {
        this.themes.forEach(theme => document.getElementById(`themeCSS-${theme.id}`).disabled = theme.id !== themeId);
        this.setThemeDesc();
    }
    
    setThemeDesc() {
        const themeDescInterval = setInterval(() => {
            if (!document.getElementById('themeDesc')) return;
            clearInterval(themeDescInterval);
            document.getElementById('themeDesc').innerHTML = vueApp.loc[this.themes.find(t => t.id === window.megaMod.getModSettingById('themeManager_themeSelect').value).locKey];
        }, 50);
    }
}

class CustomSkybox {   
    constructor(skyboxes) {
        this.skyboxes = skyboxes;
        this.usingSkyboxColor = false;

        extern.getSkybox = (skybox = window.megaMod.getModSettingById("customSkybox_skyboxSelect").value) => {
			const skyboxCategory = window.megaMod.getModSettingById("customSkybox_skyboxCategorySelect").value;
			const skyboxData = (skyboxCategory === 'colors') ? this.skyboxes[0] : this.skyboxes[skyboxCategory].find(s => s.id === skybox);
			let skyboxURL = skyboxData?.path || `${skyboxCategory}/${skybox}`;
			if (skyboxURL.startsWith('shellshock.io')) skyboxURL = skyboxURL.replace(`shellshock.io`, window.location.origin);
			if (!skyboxURL.startsWith('http')) skyboxURL = `${rawPath}/img/skyboxes/${skyboxURL}`;
			return skyboxURL;
		};
        this.onSkyboxCategoryChanged(window.megaMod.getModSettingById('customSkybox_skyboxCategorySelect').value, true);
    }

    setSkybox(skybox) {
        this.skybox = skybox;
    }

    onSkyboxCategoryChanged(value, init) {
        const isCustomSkyboxEnabled = extern.modSettingEnabled("customSkybox");
        this.usingSkyboxColor = value === "colors";
        let r, g, b;
        if (this.usingSkyboxColor) {
            const getColorValue = id => window.megaMod.getModSettingById(id).value;
            r = getColorValue('customSkybox_colorSlider_r');
            g = getColorValue('customSkybox_colorSlider_g');
            b = getColorValue('customSkybox_colorSlider_b');
        } else {
            const select = window.megaMod.getModSettingById('customSkybox_skyboxSelect');
            select.options = this.skyboxes[value];
            select.defaultVal = select.options[0].id;
            if (!init) select.value = select.defaultVal;
        }
        extern.updateSkybox(isCustomSkyboxEnabled, r, g, b);
    }
}

window.megaMod = new MegaMod(window.megaModErrors.regexErrs, window.megaModErrors.modConflicts);
window.megaMod.start();