// MegaMod
Object.assign(unsafeWindow, {
	megaModErrors: {
		regexErrs: [],
		modConflicts: [],
	},
	SettingType: {
		Slider: 0,
		Toggler: 1,
		Keybind: 2,
		Select: 3,
		Group: 4,
		HTML: 5
	},
	PrettyChallengeType: {
		 0: "Kills",
		 1: "Damage",
		 2: "Deaths",
		 3: "Movement",
		 4: "Pickups",
		 5: "Timed",
		 6: "KoTC",
		 7: "CTS",
		 8: "FFA",
		 9: "Items",
		 10: "Eggs Earned",
		 11: "Shop"
	},
	PrettyChallengeSubType: {
		 0: "Killstreak",
		 1: "Weapon Type",
		 2: "Damage",
		 3: "Distance",
		 4: "Jumps",
		 5: "Map",
		 6: "Time Played",
		 7: "Time Alive",
		 8: "Condition",
		 9: "Color",
		 10: "Kills",
		 11: "Shot",
		 12: "Health",
		 13: "Scoped",
		 14: "Scope",
		 15: "Deaths",
		 16: "One-Shot",
		 17: "Reload",
		 18: "Pickups",
		 20: "Capturing",
		 21: "Capture",
		 22: "Contest",
		 23: "Win"
	},
	ChatEvent: {
		 joinGame: 0,
		 leaveGame: 1,
		 switchTeam: 2,
	},
	teamLocs: ['team_blue', 'team_red'],
	rawPath: "https://1nf1n1t3sm4sh3r.github.io/mm-playtest",
	cdnPath: "https://1nf1n1t3sm4sh3r.github.io/mm-playtest"
});
unsafeWindow.ChatEventData = {
	[ChatEvent.joinGame]: {
		loc: 'megaMod_betterUI_chatEvent_joinGame',
		setting: 'betterUI_chatEvent_joinGame'
	},
	[ChatEvent.leaveGame]: {
		loc: 'megaMod_betterUI_chatEvent_leaveGame',
		setting: 'betterUI_chatEvent_leaveGame'
	},
	[ChatEvent.switchTeam]: {
		loc: 'megaMod_betterUI_chatEvent_switchTeam',
		setting: 'betterUI_chatEvent_switchTeam'
	}
};

function addHTMLEdits() {
	// MegaMod UI
	const messages = `
	<div v-show="reloadNeeded && (showModsTab || showSettingsTab)" class="roundme_md mod-msg reload ss_margintop_lg ss_marginbottom_lg">
		<div>
			<button class="dismiss_btn clickme roundme_sm" @click="dismissRefresh"><i class="fas fa-times text_red fa-2x"></i></button>
			<h4 v-html="loc.p_settings_mods_reload_title"></h4>
			<span>
				<p v-html="loc.p_settings_mods_reload_desc1"></p>
				<p v-html="loc.p_settings_mods_reload_desc2"></p>
			</span>
			<button class="fa ss_button btn_red bevel_red fullwidth" style="margin-bottom: 0 !important;" @click="refreshPage"><i class="fas fa-sync"></i> Reload Page</button>
		</div>
	</div>
	<div v-show="(!reloadNeeded && showModsTab) || (showSettingsTab && currentMod.noSettings)" class="roundme_md mod-msg info ss_margintop_lg ss_marginbottom_lg">
		<div>
			<h4 v-html="loc.p_settings_mods_info_title"></h4>
			<span>
				<p v-html="loc.p_settings_mods_info_desc1"></p>
				<p v-html="loc.p_settings_mods_info_desc2"></p>
				<p style="margin-bottom: 0;" v-html="loc.p_settings_mods_info_desc3"></p>
			</span>
		</div>
	</div>
	`;
	
	const settingConditional = `
	<div v-if="s.type === SettingType.Slider">
		<div class="nowrap" v-show="eval(s.showCondition)">
			<settings-adjuster :loc="loc" :loc-key="s?.locKey" :control-id="s.id" :control-value="s.value" :min="s.min" :max="s.max" :step="s.step" :multiplier="s.multiplier" :precision="s.precision" @setting-adjusted="onSettingAdjusted"></settings-adjuster>
		</div>
	</div>

	<div v-if="s.type === SettingType.Toggler">
		<div class="nowrap" v-show="eval(s.showCondition)">
			<settings-toggler :loc="loc" :loc-key="s?.locKey" :control-id="s.id" :control-value="s.value" @setting-toggled="onSettingToggled"></settings-toggler>
		</div>
	</div>

	<div v-if="s.type === SettingType.Keybind">
		<div class="nowrap" v-show="eval(s.showCondition)">
			<settings-control-binder :loc="loc" :control-id="s.id" :control-value="s.value" @control-captured="onGameControlCaptured"></settings-control-binder>
			<div class="label">{{ loc[s?.locKey ?? ''] || s?.locKey }}</div>
		</div>
	</div>

	<div v-if="s.type === SettingType.Select">
		<div v-show="eval(s.showCondition)">
			<h3 class="margin-bottom-none h-short">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
			<select :id="s.id" @change="onSelectChanged(s.id, $event.target.options[$event.target.selectedIndex].id)" class="ss_select ss_marginright_sm ss_select">
				<option v-for="o in s.options" :id="o.id" :selected="o.id === s.value">{{ loc[o?.locKey ?? ''] || o?.locKey }}</option>
			</select>
		</div>
	</div>
	`;

	const settings = document.getElementById("settings-template");
	settings.innerHTML = settings.innerHTML
		.replace('column-3-eq', 'column-5-custom')
		.replace(`</div>\n\n    <div`, `
		<button id="mod_button" @click="switchTab('mod_button')" class="ss_bigtab bevel_blue ss_bigtab bevel_blue roundme_md font-sigmar f_row align-items-center justify-content-center gap-sm" :class="(showModsTab ? 'selected' : '')">
			<i class="fas fa-tools fa-lg"></i>
		</button>
		<button id="settings_button" @click="openMegaModSettings" @mouseenter="settingsTabHover" class="ss_bigtab settingstab bevel_blue roundme_md font-sigmar f_row align-items-center justify-content-center gap-sm" :class="(showSettingsTab ? 'selected' : '')">
		<i class="fas fa-cog fa-lg"></i>
		</button>
		</div>\n\n    <div`)
		.replace(`toggler>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>`, `toggler>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>
		<div id="settings_mods" v-show="showModsTab" class="settings-section">
			<h3 class="margin-bottom-none h-short" v-html="loc.p_settings_mods_title"></h3>
			<div class="display-grid grid-column-2-eq">
				<div v-for="s in settingsUi?.modSettings?.filter(s => !s.disabled && s.id !== 'megaMod') || []" class="f_col">
					<div v-if="s.type === SettingType.Toggler">
						<div class="nowrap" :class="s.showInfo ? 'has-settings' : ''">
							<settings-toggler :loc="loc" :loc-key="s.locKey + '_title'" :control-id="s.id" :control-value="s.value" @setting-toggled="onSettingToggled"></settings-toggler>
							<span v-if="s.showInfo" @click="showModSettings(s.id)">
								<i class="fas fa-cog modsettings-icon" @mouseenter="modSettingsHover"></i>
							</span>
						</div>
					</div>
				</div>
			</div>
			${messages}
		</div>
		<div id="settings_modSettings" v-show="showSettingsTab" class="settings-section">
			<h3 class="margin-bottom-none h-short"><i class='fas fa-info-circle'></i> {{ loc[currentMod?.locKey ? currentMod?.locKey + '_title': ''] || '' }} | Info{{ (currentMod && !currentMod.noSettings) ? ' + Settings' : '' }}</h3>
			<p v-html="loc[currentMod?.locKey ? currentMod?.locKey + '_desc' : ''] || ''" class="mod-desc"></p>
			<p v-show="currentMod && currentMod.noSettings" class="no-additional-settings"><br>No Additional Settings :)</br></p>
			<div class="display-grid grid-column-2-eq">
				<div v-if="currentMod && !currentMod.noSettings" v-for="s in currentMod?.settings.filter(s => !s.disabled) || []" class="f_col">
					${settingConditional}
					<div v-if="s.type === SettingType.Group">
						<div v-show="eval(s.showCondition)">
							<h3 class="margin-bottom-none h-short" v-if="s?.locKey">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
							<div v-if="s.settings && s.settings.length" v-for="x in s?.settings.filter(s => !s.disabled) || []" class="f_col">
								${settingConditional.replaceAll("s.", "x.").replaceAll("s?.", "x?.")}
								<div v-if="x.type === SettingType.Group">
									<div v-show="eval(x.showCondition)">
										<h3 class="margin-bottom-none h-short" v-if="x.locKey">{{ loc[x?.locKey ?? ''] || x?.locKey }}</h3>
										<div v-if="x.settings && x.settings.length" v-for="y in x?.settings.filter(s => !s.disabled) || []" class="f_col">
											${settingConditional.replaceAll("s.", "y.").replaceAll("s?.", "y?.")}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div v-if="s.type === SettingType.HTML">
						<h3 class="margin-bottom-none h-short" v-if="s?.locKey">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
						<div v-show="eval(s.showCondition)" v-html="s.html"></div>
					</div>
				</div>
			</div>
			${messages}
		</div>
	</div>
	`);

	const oldSettingsData = comp_settings.data();
	comp_settings.data = function() {
		return {
			...oldSettingsData,
			showModsTab: false,
			showSettingsTab: false,
			reloadNeeded: false,
			currentMod: null,
			flashTimeouts: []
		};
	};

	const oldSettingsClick = comp_account_panel.methods.onSettingsClick;
	comp_account_panel.methods.onSettingsClick = function() {
		oldSettingsClick.call(this);
		if (vueApp.$refs.settings.showSettingsTab) {
			vueApp.$refs.settings.showSettingsTab = false;
			vueApp.$refs.settings.showModsTab = true;
		}
	}

	const {
		switchTab: oldSwitchTab,
		onResetClick: oldResetSettingsFunc,
		onSaveClick: oldSaveSettingsFunc
	} = comp_settings.methods;
	Object.assign(comp_settings.methods, {
		switchTab(tab, modId) {
			oldSwitchTab.call(this, tab);

			this.showModsTab = false;
			this.showSettingsTab = false;
			this.currentMod = null;
			switch (tab) {
				case 'mod_button':
					this.showModsTab = true;
					if (extern?.modSettingEnabled?.("megaMod_sfx_tabs")) BAWK.play("modTab");
					break;
				case 'settings_button':
					this.currentMod = this.settingsUi.modSettings.find(m => m.id === modId);
					if (modId === "themeManager") unsafeWindow.megaMod.customTheme.setThemeDesc(); // Eh this is a lazy solution but hey it works
					this.showSettingsTab = true;
					if (extern?.modSettingEnabled?.("megaMod_sfx_tabs")) BAWK.play("settingsTab");
					break;
			}
		},
		onResetClick() {
			this.resetModSettings();
			oldResetSettingsFunc.call(this);
		},
		onSaveClick() {
			this.saveModSettings();
			oldSaveSettingsFunc.call(this);
		},
		initModSetting(setting, parentId) {
			const initSettings = (settings, parentId) => {
				if (!settings) return [];
				settings = settings.filter(setting => !setting.disabled);
				settings.forEach(s => {
					if (settings.settings) settings.settings = initSettings(settings.settings, (s.type === SettingType.Group ? (s?.parentId || parentId) : s.id));
					this.initModSetting(s, parentId);
				});
				return settings;
			};

			const ignoreSetting = [SettingType.Group, SettingType.HTML].includes(setting.type);
			let storedSetting = (setting.type === SettingType.Slider) ? localStore.getNumItem(setting.id) : (setting.type === SettingType.Toggler) ? localStore.getBoolItem(setting.id) : localStore.getItem(setting.id);
			// Validate storedSetting
			if (storedSetting != null && !ignoreSetting) {
				switch (setting.type) {
					case SettingType.Slider:
						if (typeof storedSetting !== "number" || storedSetting > setting.max || storedSetting < setting.min || (setting.step && storedSetting % setting.step !== 0)) storedSetting = null;
						break;
					case SettingType.Toggler:
						if (typeof storedSetting !== "boolean") storedSetting = null;
						break;
					case SettingType.Keybind:
						if (typeof storedSetting !== "string") storedSetting = null;
						break;
					case SettingType.Select:
						if (setting.options.length && !setting.options.map(o => o.id).includes(storedSetting)) storedSetting = null;
						break;
				}
			}
			if (!ignoreSetting) {
				if (storedSetting == null) localStore.setItem(setting.id, setting.value)
				setting.storedVal = (storedSetting != null) ? storedSetting : setting.defaultVal;
				setting.refreshReq = setting.refreshReq != null && setting.refreshReq;
			}
			Object.assign(setting, {
				disabled: !setting.active || unsafeWindow.megaMod.regexErrs.includes(setting.id),
				value: (storedSetting != null) ? storedSetting : setting.defaultVal,
				settings: initSettings(setting.settings, (setting.type === SettingType.Group ? (setting?.parentId || parentId) : setting.id)) || [],
				showCondition: setting.showCondition || 'true',
				parentId: parentId || null
			});
			return setting;
		},
		initModSettings() {
			this.settingsUi.modSettings = this.settingsUi.modSettings/*.filter(mod => mod.active && !unsafeWindow.megaMod.regexErrs.includes(mod.id))*/.map(mod => {
				mod = this.initModSetting(mod);
				Object.assign(mod, {
					noSettings: !mod?.settings?.filter(s => !s.disabled).length,
					showInfo: this.loc[mod.locKey ? `${mod.locKey}_desc` : ''] != null || mod?.settings?.length
				});
				return mod;
			});
		},
		updateSettingTab() {
			// Meh.
			if (this.showModsTab) {
				this.showModsTab = false;
				this.showModsTab = true;
			} else if (this.showSettingsTab) {
				this.showSettingsTab = false;
				this.showSettingsTab = true;
			}
		},
		showModSettings(modId) {
			this.switchTab("settings_button", modId);
			this.updateSettingTab();
		},
		checkReloadNeeded() {
			const isReloadNeeded = (setting) => (setting.refreshReq && setting.value !== setting.storedVal) || (setting.settings && setting.settings.some(isReloadNeeded));
			this.reloadNeeded = this.settingsUi.modSettings.some(isReloadNeeded);
		},
		resetModSetting(setting) {
			if (![SettingType.Group, SettingType.HTML].includes(setting.type) && setting.value !== setting.defaultVal) {
				switch (setting.type) {
					case SettingType.Slider:
						this.onSettingAdjusted(setting.id, setting.defaultVal);
						break;
					case SettingType.Toggler:
						this.onSettingToggled(setting.id, setting.defaultVal);
						break;
					case SettingType.Keybind:
						this.onGameControlCaptured(setting.id, setting.defaultVal);
						break;
					case SettingType.Select:
						this.onSelectChanged(setting.id, setting.defaultVal);
						break;
				}
				//this.updateSettingTab();
			}
		},
		resetModSettings() {
			const resetSetting = (setting) => {
				this.resetModSetting(setting);
				if (setting.settings) setting.settings.forEach(resetSetting);
			};
			this.settingsUi.modSettings.forEach(resetSetting);
			this.updateSettingTab();
			this.checkReloadNeeded();
		},
		saveModSettings() {
			const saveSetting = (setting) => {
				if (![SettingType.Group, SettingType.HTML].includes(setting.type)) {
					localStore.setItem(setting.id, setting.value);
					setting.storedVal = setting.value;
				}
				if (setting.settings) saveSetting(setting.settings);
			};
			this.settingsUi.modSettings.forEach(saveSetting);
		},
		refreshPage() {
			BAWK.play("ui_playconfirm");
			this.onSaveClick();
			window.location.reload();
		},
		dismissRefresh() {
			BAWK.play("ui_popupclose");
			extern.applyUiSettings(this.settingsUi, this.originalSettings);
			this.reloadNeeded = false;
		},
		flashSettingsIcons() {
			if (extern?.modSettingEnabled?.("megaMod_sfx") && !this.showSettingsTab) BAWK.play("ui_chicken");
			this.flashTimeouts.forEach(clearTimeout);
			this.flashTimeouts = [];
			document.querySelectorAll(".modsettings-icon").forEach(icon => {
				icon.classList.remove('icon-alert');
				// Timeout ms ≈ SFX length
				this.flashTimeouts.push(setTimeout(() => {
					icon.classList.add("icon-alert");
				}, 100));
				this.flashTimeouts.push(setTimeout(() => {
					icon.classList.remove("icon-alert");
				}, 1600));
			});
		},
		openMegaModSettings() {
			if (!this.showSettingsTab) this.showModSettings("megaMod");
		},
		openDiscord() {
			BAWK.play('ui_click');
			window.open('https://discord.gg/Cxggadazy4');
		},
		modSettingsHover() {
			if (extern?.modSettingEnabled?.("megaMod_sfx_hover")) BAWK.play("settingHover");
		},
		settingsTabHover() {
			if (extern?.modSettingEnabled?.("megaMod_sfx_hover") && !this.showSettingsTab) BAWK.play("settingsTabHover");
		}
	});

	// Better Inventory
	const invEditsEnabled = `extern?.modSettingEnabled?.('betterUI_inventory')`;
	// Add Random Skin Button, Searchbar Class Edits, and Item Amount
	const equipScreen = document.getElementById("equip-screen-template");
	equipScreen.innerHTML = equipScreen.innerHTML.replace(
		`" v-on:keyup="onItemSearchChange" class="ss_field font-nunito box_relative fullwidth">`,
		`" v-on:keyup="onItemSearchChange" class="ss_field font-nunito roundme_lg box_relative" :class="{'limited-input' : (${invEditsEnabled} && isOnEquipModeFeatured), 'fullwidth': !${invEditsEnabled}}">
		<button id="randomize-button" onclick="window.megaMod.betterUI.randomizeSkin()" v-show="${invEditsEnabled} && isEquipModeInventory" class="ss_button roundme_lg btn_blue bevel_blue btn-account-w-icon random-button">
			<i v-show="${invEditsEnabled}" class="fas fa-random"></i>
		</button>`
	).replace(
		`class="item-search-wrap box_relative"`,
		`class="item-search-wrap box_relative" :class="{ 'inventory-skin-search' : (${invEditsEnabled} && isEquipModeInventory), 'shop-skin-search' : (${invEditsEnabled} && (isOnEquipModeSkins || isOnEquipModeFeatured)) }"`
	).replace(
		`categoryLocKey] }}`,
		`categoryLocKey] }} {{ (${invEditsEnabled}) ? ('(' + equip.showingItems.length + '/' + (equip.showingItemTotal || 0) + ')') : '' }}`
	).replace(
		`onRedeemClick">{{`,
		`onRedeemClick"><i v-show="${invEditsEnabled}" class="fas fa-unlock"></i> {{`
	).replace(
		`inGame">{{`,
		`inGame"><i v-show="${invEditsEnabled}" class="fas fa-camera"></i> {{`
	).replace(
		`loc.eq_search_items`,
		`${invEditsEnabled} ? loc.eq_search_items_new : loc.eq_search_items`
	);

	Object.assign(vueData.equip, {
		showingItemTotal: 0,
		updateShowingItemTotal() {
			this.showingItemTotal = vueApp.getShowingItemTotal();
		}
	});

	const oldWeaponSelect = comp_weapon_select_panel.methods.onWeaponSelect;
	comp_weapon_select_panel.methods.onWeaponSelect = function(...args) {
		oldWeaponSelect.apply(this, args);
		vueApp.equip.updateShowingItemTotal();
	}

	const {
		switchItemType: oldSwitchItemType,
		switchTo: oldSwitchTo,
		onChangedClass: oldOnChangedClass
	} = comp_equip_screen.methods;
	Object.assign(comp_equip_screen.methods, {
		switchItemType(...args) {
			oldSwitchItemType.apply(this, args);
			vueApp.equip.updateShowingItemTotal();
		},
		switchTo(...args) {
			oldSwitchTo.apply(this, args);
			vueApp.equip.updateShowingItemTotal();
		},
		onChangedClass(...args) {
			oldOnChangedClass.apply(this, args);
			// Fixes selected item highlight when changing class
			if (extern.modSettingEnabled("betterUI_inventory") && this.equip.showingItems.length) {
				if (this.showShop && (this.isOnEquipModeFeatured || this.isOnEquipModeSkins)) this.selectFirstItemInShop();
				else this.selectEquippedItemForType();
			}
		},
		// Rewrote this function & fixed pistol not updating in photobooth when switching main weapon class
		poseEquippedItems() {
			const items = { ...this.equipped };
			const { showingWeaponType, posingStampPositionX, posingStampPositionY } = this.equip;
			
			if (!this.ui.showHomeEquipUi) {
				Object.keys(items).forEach(key => {
					key = parseInt(key, 10);
					const isPrimaryOrSecondary = this.equip.selectedItemType === ItemType.Primary && key === ItemType.Secondary;
					const pistolHidden = !vueApp.$refs.photoBooth.egg.items.find(i => i.value == ItemType.Secondary).hidden;
					// Pistol was getting deleted from the array and thus wasn't updating
					if (key !== this.equip.selectedItemType && !(extern.modSettingEnabled("betterUI_inventory") && isPrimaryOrSecondary && pistolHidden)) delete items[key];
				});
			} else {
				[ItemType.Melee, ItemType.Grenade].forEach(type => {
					if (showingWeaponType !== type) items[type] = null;
				});
			}
			
			extern.poseWithItems(items, posingStampPositionX, posingStampPositionY);
		},
		selectFirstItemInShop() {
			if (this.showShop && (this.isOnEquipModeFeatured || this.isOnEquipModeSkins) && this.equip.showingItems.length) {
				this.equip.showingItems[0].ignoreFireSound = extern.modSettingEnabled("betterUI_inventory");
				this.selectItem(this.equip.showingItems[0]); // Fixes selected premium item playing sound
			}
		},
		// Inventory Item Click SFX
		selectItemClickSound(selectedItem) {
			const legacySfxEnabled = extern?.modSettingEnabled?.("legacyMode_sfx");
			let selectSound;
			if (!selectedItem?.ignoreFireSound && ![ItemType.Hat, ItemType.Stamp].includes(selectedItem.item_type_id) && (selectedItem.unlock !== 'default' || legacySfxEnabled)) {
				const meshName = selectedItem.item_data.meshName;
				switch (selectedItem.item_type_id) {
					case ItemType.Grenade:
						selectSound = (selectedItem.id === 16000 && extern?.modSettingEnabled("legacyMode_sfx_gexplode")) ? "grenade" : selectedItem.item_data.sound;
						break;
					case ItemType.Melee:
						const sounds = Object.keys(BAWK.sounds).filter(s => s.startsWith(meshName));
						selectSound = sounds[Math.floor(Math.random() * sounds.length)];
						break;
					default:
						const weaponClass = meshName.split("_Legacy")[0];
						selectSound = (legacySfxEnabled && selectedItem.unlock === "default" && extern?.modSettingEnabled(`legacyMode_sfx_${weaponClass.split("_")[1]}_enabled`)) ? `${weaponClass}_fire_Legacy` : `${meshName}_fire`;
						break;
				}
			}
			if (eval(invEditsEnabled) && !selectedItem?.ignoreFireSound && BAWK.sounds[selectSound] && [CharClass.Soldier, CharClass.Whipper].includes(selectedItem.exclusive_for_class)) {
				if (this.fireInterval) clearInterval(this.fireInterval);

				let shotCount = 0;
				this.fireInterval = setInterval(() => {
					if (shotCount >= 5) clearInterval(this.fireInterval);
					BAWK.play(selectSound);
					shotCount++;
				}, selectedItem.exclusive_for_class === CharClass.Whipper ? (2 / 0.9 * 30) : (3 / 0.9 * 30)); // rof / 0.9 * 30
			} else {
				delete selectedItem.ignoreFireSound;
				BAWK.play(selectSound, '', 'ui_click');
			}
		}
	});

	// Add Item Icons
	const item = document.getElementById("item-template");
	item.innerHTML = item.innerHTML.replace(`<span v-if="isVipItem`,
		`<i v-if="${invEditsEnabled} && hasIcon" :class="iconClass" class="item-icon" @click.stop="iconClick" @mouseenter="iconHover"></i> 
		<span @click="iconClick" @mouseenter="iconHover" v-if="isVipItem`
	);

	// Add Profile Image and Badges
	const profileScreen = document.getElementById("profile-screen-template");
	const badgesEnabled = `extern?.modSettingEnabled?.('betterUI_badges')`;
	const pfpEnabled = `extern?.modSettingEnabled?.('betterUI_pfp')`;
	profileScreen.innerHTML = profileScreen.innerHTML.replace(
		`center">\n\t\t\t\t\t<section>`,
		`center">
		<div id="player_photo" v-show="(${pfpEnabled}) && photoUrl && photoUrl !== '' && !isAnonymous">
			<img :src="photoUrl" class="roundme_md"/>
	  	</div><section>`).replace(`s"></p>`, `s"></p>
		<span v-show="${badgesEnabled}" v-for="(row, i) in (badges?.rows.length ? badges.rows : [{ main: [], tier: [] }])">
			<div class="roundme_md profile-badge-container">
				<span :class="{'info-btn-span': !(row.main.length || row.tier.length) }" v-if="i === 0">
					<i class="fas fa-info-circle info-btn" @click="vueApp.showBadgeInfo()"></i>
					<i class="fas fa-grip-lines-vertical badge-separator"></i>
					<h4 v-if="!(row.main.length + row.tier.length)" v-html="loc.megaMod_betterUI_noBadges"></h4>
				</span>
					
				<span v-if="row.main.length" class="main-badges">
					<div v-for="badge in row.main || []" class="player-challenge-tool-tip badge">
						<div class="tool-tip">
							<i :class="badge.classList" @click="badge.clickFunc"></i>
							<span class="tool-tip-text" v-html="loc[badge.title] || badge.title"></span>
						</div>
					</div>
				</span>
				<i v-if="row.main.length && row.tier.length" class="fas fa-grip-lines-vertical badge-separator"></i>
				<span v-if="row.tier.length" class="tier-badges">
					<div v-for="badge in row.tier || []" class="player-challenge-tool-tip badge">
						<div class="tool-tip">
							<i :class="badge.classList" @click="badge.clickFunc"></i>
							<span class="tool-tip-text" v-html="loc[badge.title] || badge.title"></span>
						</div>
					</div>
				</span>
			</div>
			<br>
		</span>
	`).replace(
		`mainLayout"`,
		`mainLayout" :class="{ 'has-badges' : (${badgesEnabled}) }"`
	).replace("<stats-content", `<stats-content ref="statsContainer"`);

	const badgePopup = `
		<large-popup id="badgeInfoPopup" ref="badgeInfoPopup" hide-confirm="true" :overlay-close="true" class="megamod-popup">
			<template slot="content">
				<h1 v-html="loc.megaMod_betterUI_badgePopup_title"></h1>
				<p v-html="loc.megaMod_betterUI_badgePopup_desc"></p>
				
				<h3>{{ loc.megaMod_betterUI_badgePopup_main_title }} ({{ badgeInfo.main.length }})</h3>
				<p class="badgeDesc" v-html="loc.megaMod_betterUI_badgePopup_main_desc"></p>
				<div class="table-div">
					<table class="roundme_md sortable">
						<thead>
							<tr>
								<th v-html="loc.megaMod_betterUI_badgePopup_header_badge"></th>
								<th v-html="loc.megaMod_betterUI_badgePopup_header_name"></th>
								<th v-html="loc.megaMod_betterUI_badgePopup_header_desc"></th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(badge, i) in badgeInfo.main">
								<td :data-sort="i">
									<i :title="loc[badge.title] || badge.title" :class="badge.classList" @click="badge.clickFunc"></i>
								</td>
								<td v-html="loc[badge.title] || badge.title"></td>
								<td v-html="badge.desc"></td>
							</tr>
						</tbody>
					</table>
					</div>
					
				<h3>{{ loc.megaMod_betterUI_badgePopup_tier_title }} ({{ badgeInfo.tier.length }})</h3>
				<p class="badgeDesc" v-html="loc.megaMod_betterUI_badgePopup_tier_desc"></p>
				<div class="table-div">
					<table class="roundme_md sortable">
						<thead>
							<th v-html="loc.megaMod_betterUI_badgePopup_header_badge"></th>
							<th v-html="loc.megaMod_betterUI_badgePopup_header_name"></th>
							<th v-html="loc.megaMod_betterUI_badgePopup_header_desc"></th>
						</thead>
						<tbody>
							<tr v-for="(badge, i) in badgeInfo.tier">
								<td :data-sort="i">
									<i :title="loc[badge.title] || badge.title" :class="badge.classList" @click="badge.clickFunc"></i>
								</td>
								<td v-html="loc[badge.title] || badge.title"></td>
								<td v-html="badge.desc"></td>
							</tr>
						</tbody>
					 </table>
				</div>
			</template>
		</large-popup>
	`;

	const challengePopup = `
		<large-popup id="challengeInfoPopup" ref="challengeInfoPopup" hide-confirm="true" :overlay-close="true" class="megamod-popup">
			<template slot="content">
				<h1 v-html="loc.megaMod_betterUI_challengePopup_title"></h1>
				<p v-html="loc.megaMod_betterUI_challengePopup_desc"></p>
				
				<h3>{{ loc.megaMod_betterUI_challengePopup_list_title }} ({{ extern.Challenges.length }})</h3>
				<div class="table-div">
					<table class="roundme_md sortable">
						<thead>
							<tr>
								<th v-html="loc.megaMod_betterUI_challengePopup_header_icon"></th>
								<th v-html="loc.megaMod_betterUI_challengePopup_header_name"></th>
								<th v-html="loc.megaMod_betterUI_challengePopup_header_desc"></th>
								<th v-html="loc.megaMod_betterUI_challengePopup_header_reward"></th>
								<th v-html="loc.megaMod_betterUI_challengePopup_header_claims"></th>
								<th v-html="loc.megaMod_betterUI_challengePopup_header_tier"></th>
								<th v-html="loc.megaMod_betterUI_challengePopup_header_type"></th>
								<th v-html="loc.megaMod_betterUI_challengePopup_header_subtype"></th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="challenge in extern.Challenges">
								<td :data-sort="challenge.id">
									<img :src="extern.playerChallenges.iconSrc(challenge.loc_ref)"></img>
								</td>
								<td> {{ loc[challenge.loc_ref + '_title'] }} </td>
								<td> {{ loc[challenge.loc_ref + '_desc'] }} </td>
								<td> 
									<div class="egg-icon display-grid grid-column-auto-1"> 
										<img src="img/svg/ico_goldenEgg.svg">
										{{ challenge.reward }}
									</div>
								</td>
								<td> {{ vueData.getChallengeClaims(challenge.id) }} </td>
								<td> {{ challenge.tier + 1 }} </td>
								<td> {{ PrettyChallengeType[challenge.type] || "N/A" }} </td>
								<td> {{ PrettyChallengeSubType[challenge.subType] || "N/A" }} </td>
							</tr>
						</tbody>
					</table>
				</div>
			</template>
		</large-popup>
	`;

	const publicMaps = `vueData.maps.filter(m => m.availability === 'both')`;

	const mapPopup = `
		<large-popup id="mapPopup" ref="mapPopup" hide-confirm="true" :overlay-close="true" class="megamod-popup">
			<template slot="content">
				<h1 v-html="loc.megaMod_betterUI_mapPopup_title"></h1>
				<p v-html="loc.megaMod_betterUI_mapPopup_desc"></p>

				<h3>{{ loc.megaMod_betterUI_mapPopup_list_title }} ({{ ${publicMaps}.length }})</h3>
				<div class="table-div">
					<table class="roundme_md sortable">
						<thead>
							<tr>
								<th v-for="mode in ['map', 'gametype_ffa', 'gametype_teams', 'gametype_ctf', 'gametype_king']" v-html="loc[mode]"></th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="map in ${publicMaps}">
								<td :data-sort="map.name" class="map-image"> 
									<div class="roundme_md text-shadow-black-40" :style="{ backgroundImage: \`url(/maps/\${map.filename}.png)\` }">
						            {{ map.name }}
						        	</div>
								</td>
								<td v-for="mode in ['FFA', 'Teams', 'Spatula', 'King']" :data-sort="map.modes[mode]" class="map-mode"> 
									<i v-if="map.modes[mode]" class="fas fa-check"></i>
									<i v-else class="fas fa-times"></i>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</template>
		</large-popup>
	`;

	const errorPopups = `
		<small-popup id="disableModsPopup" ref="disableModsPopup" hide-close="true" hide-cancel="true" :overlay-close="true" class="megamod-popup">
			<template slot="header">
				<h1 class="roundme_sm shadow_blue4 nospace text_white" v-html="loc.megaMod_disableModsPopup_title"></h1>
			</template>
			<template slot="content">
				<p v-html="disableModsPopupContent"></p>
			</template>
			<template slot="confirm">{{ loc['ok'] }}</template>
		</small-popup>
		<small-popup id="modErrsPopup" ref="modErrsPopup" hide-close="true" hide-cancel="true" :overlay-close="true" class="megamod-popup">
			<template slot="header">
				<h1 class="roundme_sm shadow_blue4 nospace text_white" v-html="loc.megaMod_modErrsPopup_title"></h1>
			</template>
			<template slot="content">
				<p v-html="modErrsPopupContent"></p>
			</template>
			<template slot="confirm">{{ loc['ok'] }}</template>
		</small-popup>
	`;


	CompPlayerChallengeList.methods.showChallengeInfo = MEDIATABS.methods.showChallengeInfo = function() {
		BAWK.play("ui_popupopen");
		vueApp.$refs.challengeInfoPopup.show();
	};

	comp_play_panel.methods.showMapPopup = function() {
		BAWK.play("ui_popupopen");
		vueApp.$refs.mapPopup.show();
	};

	// Public Map Button
	const playPanel = document.getElementById("play-panel-template");
	playPanel.innerHTML = playPanel.innerHTML.replace(
		`ss-button-dropdown>`,
		`ss-button-dropdown><button v-show="extern?.modSettingEnabled?.('betterUI_ui')" @click="showMapPopup" class="map_btn ss_button btn_big btn_blue_light bevel_blue_light btn_play_w_friends display-grid align-items-center box_relative"><span v-html="loc.megaMod_betterUI_maps"></span></button>`
	);
	
	Object.assign(vueData, {
		badges: {
			rows: []
		},
		badgeInfo: {
			main: [],
			tier: []
		},
		updateBadges() {
			this.badges = this.getBadges();
		},
		getChallengeClaims(id) {
			return extern?.account?.challengesClaimed?.filter(val => val == id)?.length;
		}, 
		disableModsPopupContent: "",
		modErrsPopupContent: ""
	});

	// Add Popups
	const docBody = document.body;
	docBody.innerHTML = docBody.innerHTML.replace(
		`<small-popup id="privacyPopup"`,
		`${badgePopup} ${challengePopup} ${mapPopup} ${errorPopups} <small-popup id="privacyPopup"`
	);

	// Adjust size of stats container for badges
	const stats = document.getElementById("stats-stats-template");
	stats.innerHTML = stats.innerHTML.replace(
		`class="stats-container`,
		`:class="{ [statsClassName] : ${badgesEnabled}, 'stats-container-pfp' : ${pfpEnabled} }" class="stats-container`
	);

	STATSPOPUP.computed.statsClassName = function() {
		return `shorter-stats-container-${vueData.badges.rows.length}`;
	}

	// VIP Color Slider
	const sliderUnlocked = `extern?.modSettingEnabled?.('colorSlider_unlock')`;
	const colorSelect = document.getElementById("color-select-template");
	colorSelect.innerHTML = colorSelect.innerHTML.replace(`</div>\n\t</div>\n`,
		`</div>
	  <div id="color-picker" v-show="extern?.modSettingEnabled?.('colorSlider')" class="color-slider">
		<div class="slider-locks" v-show="!(${sliderUnlocked} || isUpgrade)">
			<i @click="sliderClick" class="slider-saturation-lock fas fa-lock"></i>
			<i @click="sliderClick" class="slider-hue-lock fas fa-lock"></i>
			<i @click="sliderClick" class="slider-brightness-lock fas fa-lock"></i>
		</div>
		<input id="colorSlider_saturation" type="range" :disabled="!${sliderUnlocked} && !vueApp.isUpgraded" @input="updateSaturation" click="sliderClick" @change="sliderChange" v-model="saturationSliderVal" :value="saturationSliderVal" min="0" max="100" step="0.00001">
		<input id="colorSlider_hue" type="range" :disabled="!${sliderUnlocked} && !vueApp.isUpgraded" @input="updateHue" click="sliderClick" @change="sliderChange" v-model="hueSliderVal" :value="hueSliderVal" min="0" max="100" step="0.00001">
		 <input id="colorSlider_brightness" type="range" :disabled="!${sliderUnlocked} && !vueApp.isUpgraded" @input="updateBrightness" click="sliderClick" @change="sliderChange" v-model="brightnessSliderVal" :value="brightnessSliderVal" min="0" max="100" step="0.00001">
	  </div>
	</div>`).replace(
			`<span v-for="(c, index) in paidColors`,
			`<button class="ss_button roundme_lg btn_blue bevel_blue btn-account-w-icon" @click="randomizeColor" v-show="extern?.modSettingEnabled?.('colorSlider_randomizer', true)"><i class="fas fa-random"></i></button> <span v-for="(c, index) in paidColors`);

	const oldColorSelectData = comp_color_select.data();
	Object.assign(comp_color_select, {
		data() {
			return {
				...oldColorSelectData,
				hueSliderVal: 50,
				saturationSliderVal: 100,
				brightnessSliderVal: 50,
				sliderDisabled: true
			};
		},
		mounted() {
			this.sliderDisabled = !(this.isUpgrade || extern?.modSettingEnabled?.("colorSlider_unlock"));
			this.setSavedColor();
			if (extern?.usingSlider?.() && extern.account.colorIdx === 14 && extern?.modSettingEnabled?.("colorSlider_autoSave")) this.updateColor();
		}
	});

	Object.assign(comp_color_select.methods, {
		hueToHex: (hue, saturation, brightness) => {
			const h = hue / 360;
			const s = saturation / 100;
			const l = brightness / 100;

			const hueToRGB = (p, q, t) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};

			let r, g, b;
			if (s === 0) {
				r = g = b = l;
			} else {
				const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				const p = 2 * l - q;
				r = hueToRGB(p, q, h + 1 / 3);
				g = hueToRGB(p, q, h);
				b = hueToRGB(p, q, h - 1 / 3);
			}

			return `#${((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1)}`;
		},
		updateHue(setColor) {
			const hue = this.hueSliderVal * 3.6;
			this.updateGradient('--saturationSlider-gradient', hue, null, this.brightnessSliderVal);
			this.updateGradient('--brightnessSlider-gradient', hue, this.saturationSliderVal, null);
			this.setCustomColor(setColor);

			// Update Lock
			const huePos = 6.13 + ((this.hueSliderVal / 100) * (22.44 - 6.13));
			document.documentElement.style.setProperty('--hueSlider-lock-pos', `${huePos}em`);
		},
		updateSaturation(setColor) {
			const saturation = this.saturationSliderVal;
			const brightness = this.brightnessSliderVal;
			this.updateGradient('--hueSlider-gradient', null, saturation, brightness);
			this.updateGradient('--brightnessSlider-gradient', this.hueSliderVal * 3.6, saturation, null);
			this.setCustomColor(setColor);

			const saturationPos = 0.85 + ((saturation / 100) * (4.75 - 0.85));
			document.documentElement.style.setProperty('--saturationSlider-lock-pos', `${saturationPos}em`);
		},
		updateBrightness(setColor) {
			const brightness = this.brightnessSliderVal;
			this.updateGradient('--saturationSlider-gradient', this.hueSliderVal * 3.6, null, brightness);
			this.updateGradient('--hueSlider-gradient', null, this.saturationSliderVal, brightness);
			this.setCustomColor(setColor);

			const brightnessPos = 23.87 + ((brightness / 100) * (27.73 - 23.87));
			document.documentElement.style.setProperty('--brightnessSlider-lock-pos', `${brightnessPos}em`);
			document.documentElement.style.setProperty('--slider-lock-brightness', `${(brightness <= 75) ? 100 : 0}%`); // OLD --> (100 - brightness)
		},
		updateColor(setColor) {
			this.updateHue(setColor);
			this.updateSaturation(setColor);
			this.updateBrightness(setColor);
		},
		updateGradient(property, hue, saturation, brightness) {
			const hueMod = hue === null;
			const satMod = saturation === null;
			const briMod = brightness === null;
			const maxVal = (hueMod) ? 80 : 100;

			let steps = '';
			for (let i = 0; i <= maxVal; i += 10) {
				steps += `hsl(${hueMod ? (i * 4.5) : hue}, ${(satMod) ? i : saturation}%, ${(briMod) ? i : brightness}%)`;
				steps += (i !== maxVal) ? ", " : "";
			}
			document.documentElement.style.setProperty(property, `linear-gradient(90deg, ${steps})`);
		},
		setCustomColor(setColor) {
			const hue = this.hueSliderVal * 3.6;
			const saturation = this.saturationSliderVal;
			const brightness = this.brightnessSliderVal;

			document.documentElement.style.setProperty('--slider-selected-color', `hsl(${hue}, ${saturation}%, ${brightness}%)`);
			if (setColor) extern.setSliderColor(this.hueToHex(hue, saturation, brightness));
		},
		sliderClick() {
			if (this.sliderDisabled) {
				vueApp.showSubStorePopup();
				return;
			}
			this.updateColor();
			BAWK.play('ui_onchange');
		},
		sliderChange() {
			BAWK.play('ui_onchange');
			const hueVal = this.hueSliderVal;
			const satVal = this.saturationSliderVal;
			const briVal = this.brightnessSliderVal;
			localStore.setItem('colorSlider_h', hueVal);
			localStore.setItem('colorSlider_s', satVal);
			localStore.setItem('colorSlider_l', briVal);
			localStore.setItem('colorSlider_hex', this.hueToHex(hueVal * 3.6, satVal, briVal));
		},
		setSavedColor() {
			const hueVal = localStore.getNumItem("colorSlider_h");
			const satVal = localStore.getNumItem("colorSlider_s");
			const briVal = localStore.getNumItem("colorSlider_l");
			if (hueVal != null) this.hueSliderVal = hueVal;
			if (satVal != null) this.saturationSliderVal = satVal;
			if (briVal != null) this.brightnessSliderVal = briVal;
			this.updateColor(false);
		},
		randomizeColor() {
			if (Math.random() < 0.5 || this.sliderDisabled || !extern?.modSettingEnabled?.("colorSlider")) {
				extern.setShellColor(Math.floor(Math.random() * ((this.isUpgrade) ? 14 : 7)));
			} else {
				Object.assign(this, {
					hueSliderVal: Math.floor(Math.random() * 101),
					saturationSliderVal: Math.floor(Math.random() * 101),
					brightnessSliderVal: Math.floor(Math.random() * 101)
				});
				this.updateColor(true);
			}
			BAWK.play('ui_onchange');
		}
	});

	// Killstreak Info & First-Person Spec
	const ksInfoEnabled = `extern?.modSettingEnabled?.('killstreakInfo')`;
	const inFirstPerson = `!ui.game.spectatingPlayerName || game.isPaused`;
	const crosshairDot = `${inFirstPerson} && !extern?.modSettingEnabled?.('specTweaks_crosshair_dot')`;
	const crosshairMain = `${inFirstPerson} && !extern?.modSettingEnabled?.('specTweaks_crosshair_main')`;
	const updownKeybinds = `extern?.modSettingEnabled?.('specTweaks_updown')`;
	const gameScreen = document.getElementById("game-screen-template");
	gameScreen.innerHTML = gameScreen.innerHTML.replace(
		`uts">`,
		`uts">
		 <h5 v-show="${ksInfoEnabled} && !game.isPaused" class="nospace title">TIME</h5>
		 <p v-show="${ksInfoEnabled} && !game.isPaused" id="playTimer" class="name">0:00.000</p>`
	).replace(
		`!ui.game.spectate`, `(!game.isPaused && !ui.game.spectate) || (!game.isPaused && ui.game.spectatingPlayerName && extern?.modSettingEnabled?.('specTweaks_health'))`
	).replace(
		`reticleDot"`, `reticleDot" v-show="${crosshairDot}"`
	).replace(
		`redDotReticle"`, `redDotReticle" v-show="${crosshairDot}"`
	).replace(
		`crosshairContainer"`, `crosshairContainer" v-show="${crosshairMain}"`
	).replace(
		`shotReticleContainer"`, `shotReticleContainer" v-show="${crosshairMain}"`
	).replace(
		`readyBrackets"`, `readyBrackets" v-show="${crosshairMain}"`
	).replace(
		`<span class="fas fa-arrow-up"></span>`,
		`<span v-show="!(${updownKeybinds})" class="fas fa-arrow-up"></span>{{ upSpectateTxt }}`
	).replace(
		`<span class="fas fa-arrow-down"></span>`,
		`<span v-show="!(${updownKeybinds})" class="fas fa-arrow-down"></span>{{ downSpectateTxt }}`
	).replace(
		`&nbsp;{{ loc.ui_game_spectate_select`,
		`{{ loc.ui_game_spectate_select`
	).replace(
		`div>{{ spectateControls }}`, `div v-html="spectateControlTxt">`
	).replace(
		`<span class="text_yellow"`,
		`<i v-show="extern?.modSettingEnabled?.('betterUI_chat')" class="fas6 fa-bullhorn hidden text_yellow ss_marginright_xs"></i><span class="text_yellow"`
	);

	const oldGameScreenData = comp_game_screen.data();
	Object.assign(comp_game_screen, {
		data() {
			Object.assign(oldGameScreenData, {
				upSpectateTxt: "",
				downSpectateTxt: "",
				spectateControlTxt: ""
			});
			return oldGameScreenData;
		},
		mounted() {
			this.updateSpectateControls();
		}
	});

	Object.assign(comp_game_screen.methods, {
		updateSpectateControls() {
			const specEnabled = extern?.modSettingEnabled?.("specTweaks");
			const specControls = this.settingsUi.controls.keyboard.spectate;
			this.upSpectateTxt = extern?.modSettingEnabled?.("specTweaks_updown") ? specControls.find(i => i.id === "ascend").value : '';
			this.downSpectateTxt = extern?.modSettingEnabled?.("specTweaks_updown") ? specControls.find(i => i.id === "descend").value : '';
			if (specEnabled) this.downSpectateTxt += " :";

			const freecamKey = this.settingsUi.controls.keyboard.spectate.find(item => item.id === "toggle_freecam")?.value;
			let controlTxt = this.loc[specEnabled ? 'ui_game_spectate_controls_exit' : 'ui_game_spectate_controls'].format(freecamKey);

			const addModSettingKey = (mod, keyId, locKey) => {
				const key = unsafeWindow?.megaMod?.getModSettingById?.(keyId)?.value;
				if (extern?.modSettingEnabled?.(mod)) controlTxt += this.loc[locKey].format(key);
			};
			addModSettingKey("hideHUD", "hideHUD_keybind", 'ui_game_spectate_controls_hud');
			addModSettingKey("specTweaks", "specTweaks_freezeKeybind", 'ui_game_spectate_controls_freeze');

			this.spectateControlTxt = controlTxt;
		}
	});

	// Photobooth Egg Spin
	const photoBooth = document.getElementById("photoBooth-screen-template");
	photoBooth.innerHTML = photoBooth.innerHTML.replace(
		`loc.screen_photo_booth_screenshot }}</button>`,
		`loc.screen_photo_booth_screenshot }}</button>
	<div v-show="extern?.modSettingEnabled?.('pbSpin')">
		<section id="photoBooth-fps" class="ss_marginbottom ss_margintop">
			<ss-button-dropdown class="btn-1 fullwidth" :loc="loc" :loc-txt="fpsTxt" :list-items="egg.fpsAmounts" :selected-item="fps" menuPos="right" @onListItemClick="onChangeFPS" :loc-list="true"></ss-button-dropdown>
		</section>
		<section id="photoBooth-spin-speed" class="ss_marginbottom ss_margintop">
			<ss-button-dropdown class="btn-1 fullwidth" :loc="loc" :loc-txt="spinSpeedTxt" :list-items="egg.spinSpeeds" :selected-item="spinSpeed" menuPos="right" @onListItemClick="onChangeSpinSpeed" :loc-list="true"></ss-button-dropdown>
		</section>
		<button class="ss_button btn_yolk bevel_yolk box_relative fullwidth text-uppercase" @click="spinEgg(false)"><i class="fas fa-sync-alt"></i> {{ loc.screen_photo_booth_spin }}</button>
		<button disabled class="ss_button btn_yolk bevel_yolk box_relative fullwidth text-uppercase" @click="spinEgg(true)"><i class="fas fa-file-video"></i> {{ loc.screen_photo_booth_gif }}</button>
	</div>
	`);

	const oldPhotoBoothData = CompPhotoboothUi.data();
	CompPhotoboothUi.data = function() {
		Object.assign(oldPhotoBoothData.egg, {
			fpsAmounts: [
				{ id: 'egg-fps-low', name: 'screen_photo_booth_fps_low', value: 0, fps: 15 },
				{ id: 'egg-fps-med', name: 'screen_photo_booth_fps_med', value: 1, fps: 30 },
				{ id: 'egg-fps-high', name: 'screen_photo_booth_fps_high', value: 2, fps: 60 }
			],
			spinSpeeds: [
				{ id: 'egg-speed-slow', name: 'screen_photo_booth_speed_slow', value: 0, time: 2000 },
				{ id: 'egg-speed-normal', name: 'screen_photo_booth_speed_normal', value: 1, time: 1000 },
				{ id: 'egg-speed-fast', name: 'screen_photo_booth_speed_fast', value: 2, time: 500 }
			],
		});
		return {
			...oldPhotoBoothData,
			fps: 1,
			spinSpeed: 1
		};
	};

	Object.assign(CompPhotoboothUi.methods, {
		spinEgg(gif) {
			const time = this.egg.spinSpeeds[this.spinSpeed].time;
			const fps = this.egg.fpsAmounts[this.fps].fps;
			extern.spinEgg(time, Math.ceil(time * fps / 1000), gif && unsafeWindow.megaMod.photoboothEggSpin.captureFrame);
		},
		onChangeFPS(fps) {
			if (fps === this.fps) return;
			this.fps = fps;
			BAWK.play('ui_click');
		},
		onChangeSpinSpeed(speed) {
			if (speed === this.spinSpeed) return;
			this.spinSpeed = speed;
			BAWK.play('ui_click');
		}
	});
	Object.assign(CompPhotoboothUi.computed, {
		fpsTxt() {
			return {
				title: this.loc.screen_photo_booth_fps_title || "Spinning GIF FPS",
				subTitle: this.loc[this.egg.fpsAmounts[this.fps].name] || "Medium (30 FPS)"
			};
		},
		spinSpeedTxt() {
			return {
				title: this.loc.screen_photo_booth_speed_title || "Spin Speed",
				subTitle: this.loc[this.egg.spinSpeeds[this.spinSpeed].name] || "Normal"
			};
		}
	});

	// Custom Changelog
	Object.assign(comp_footer_links_panel.methods, {
		onChangelogClicked (megaMod = false) {
			vueApp.showChangelogPopup(megaMod);
			BAWK.play('ui_popupopen');
		},
		onServerClicked() {
			vueApp.$refs.settings.openDiscord();
		}
	});

	const changelog = document.getElementById("changelogPopup");
	const megaModChangelog = "changelog.megaModChangelog || false";
	changelog.innerHTML = changelog.innerHTML.replace(
		`{{ loc.changelog_title }}`,
		``
	).replace(
		`id="popup_title nospace"`,
		`id="popup_title nospace" v-html="(${megaModChangelog}) ? loc.megaMod_changelog_title : loc.changelog_title"`
	).replace(
		`changelog.current`,
		`(${megaModChangelog}) ? changelog.megaMod.current : changelog.current`
	).replace(
		`changelog.showHistoryBtn`,
		`(${megaModChangelog}) ? changelog.showMegaModHistoryBtn : changelog.showHistoryBtn`
	).replace(
		"showHistoryChangelogPopup", "showHistoryChangelogPopup(changelog.megaModChangelog)"
	).replace(
		`<div id="btn`,
		`<button v-if="${megaModChangelog}" @click="openMegaModInfo" class="ss_button btn_yolk bevel_yolk ss_margintop_lg">{{ loc.megaMod_changelog_wtc }}</button> <div id="btn`
	);

	// Add Footer Changelog
	const footer = document.getElementById("footer-links-panel-template");
	footer.innerHTML = footer.innerHTML.replace("onChangelogClicked", "onChangelogClicked(false)").replace(
		`version }}</button> | `,
		`version }}</button> | 
		<button class="ss_button_as_text" target="_blank" @click="onChangelogClicked(true)">The MegaMod <i class='fas fa-tools fa-sm'></i></button> | 
		<button class="ss_button_as_text modServer" target="_blank" @click="onServerClicked"><img src="${rawPath}/img/assets/logos/modServer.png" class='serverIcon'></img></button> | `);

	Object.assign(vueData.changelog, { megaModChangelog: false, showMegaModHistoryBtn: true });
	vueData.openMegaModInfo = () => {
		window.open('https://github.com/1nf1n1t3Sm4sh3r/mm-playtest/blob/main/README.md', '_blank').focus();
		BAWK.play("ui_click");
	};


	// Challenge Status (Icon + Tooltip)
	const challenge = document.getElementById("player_challenge");
	challenge.innerHTML = challenge.innerHTML.replace(
		`<div ref="title"`,
		`<div class="player-challenge-tool-tip status">
			<div class="tool-tip">
				<i class="challenge-status" :class="iconClass"></i>
				<span class="tool-tip-text" v-html="tooltipTxt"></span>
			</div>
		</div>
		<div ref="title"`
	).replace(
		`class="player-challenge-single`,
		`:class="{ 'claimed' : data.claimed }" class="player-challenge-single`
	);

	Object.assign(CompPlayerChallengeSingle.computed, {
		isFresh() {
			const timesClaimed = extern.account.challengesClaimed.filter(val => val == this.data.challengeId).length;
			const claimedToday = this.data.claimed && extern.account.challengesClaimed.slice(-extern.account.challenges.filter(c => c.claimed).length).includes(this.data.challengeId.toString());
			return !timesClaimed || timesClaimed === 1 && claimedToday;
		},
		iconClass() {
			return this.isFresh ? "fas6 fa-sparkles" : "fas6 fa-history";
		},
		tooltipTxt() {
			return this.loc[this.isFresh ? 'challenges_new' : 'challenges_repeat'];
		}
	});

	const oldActionBtnClick = CompPlayerChallengeSingle.methods.onActionBtnClick;
	CompPlayerChallengeSingle.methods.onActionBtnClick = function(...args) {
		if ((this.data.reset || this.completed) && !this.onClaimClicked) {
			extern.account.challengesClaimed.push(this.data.challengeId.toString());
			extern.account.challengesClaimedUnique = [...new Set(extern.account.challengesClaimed)];
		}
		oldActionBtnClick.apply(this, args);
	}

	// (Home Screen) Clock Icon Next To Challenge Timer, Challenge Info Button
	const chlgInfoIcon = `<i v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="fas fa-info-circle info-btn" @click="showChallengeInfo()"></i>`;
	const mediaTabs = document.getElementById("media-tabs-template");
	mediaTabs.innerHTML = mediaTabs.innerHTML.replace(
		`<span v-show="challengeDailyData.days"`,
		`<i v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="far fa-clock"></i><span <span v-show="challengeDailyData.days"`
	).replace(
		`</span>\n\t\t\t\t</h4>\n\t\t\t\t<div class="display-grid`,
		`${chlgInfoIcon}</span>\n\t\t\t\t</h4>\n\t\t\t\t<div class="display-grid`
	);

	// (Respawn Menu) Challenge Info Button
	const challengeList = document.getElementById("player_challenge_list");
	challengeList.innerHTML = challengeList.innerHTML.replace(
		`loc.challenges }}</h4>`,
		`loc.challenges }} ${chlgInfoIcon}</h4>`
	);


	// FontAwesome Regular Icon on Homepage (to have the icon font loaded for everything else) 
	const gameInfo = document.getElementById("gameDescription");
	gameInfo.innerHTML = gameInfo.innerHTML.replace(
		`>{{ loc.home_desc_about }}`,
		`><i v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="far6 fa-egg-fried"></i> 
		{{ loc.home_desc_about }}
		<i v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="fas6 fa-egg-fried"></i>`
	);

	const oldShow = Loader.show;
	Loader.show = function() {
		oldShow.call(this);
		const megaModLogo = document.createElement('img');
		Object.assign(megaModLogo, {
			id: "megaModLogo",
			src: `${rawPath}/img/assets/logos/megaMod-${Math.floor(Math.random()*5)}.png`,
			style: `
				width: 19em;
				display: block;
				margin: 5em auto 0;
				z-index: 2000;
				position: absolute;
				left: 50%;
				bottom: 14em;
				transform: translateX(-50%);
			`
		});
		document.getElementById('progress-container').appendChild(megaModLogo);
	}
}

const oldOpen = XMLHttpRequest.prototype.open;
const oldResponse = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'response').get;
XMLHttpRequest.prototype.open = function(...args) {
	this.shellSource = args[1]?.includes("shellshock.js");
	oldOpen.apply(this, args);
};
Object.defineProperty(XMLHttpRequest.prototype, 'response', {
	get() {
		const responseStr = oldResponse.call(this);
		return this.shellSource ? editSource(responseStr) : responseStr;
	}
});

String.prototype.safeReplace = function(searchStr, replacement, ids, all = false) {
	ids = Array.isArray(ids) ? ids : [ids];
	const str = this.toString();
	if (str.indexOf(searchStr) === -1) {
		unsafeWindow.megaModErrors.regexErrs.push(...ids);
		console.error(`MegaMod: Match not found for regex pattern: ${searchStr}`);
		return str;
	}
	return all ? str.replaceAll(searchStr, replacement) : str.replace(searchStr, replacement);
};
RegExp.prototype.safeExec = function(src, ids) {
	ids = Array.isArray(ids) ? ids : [ids];
	const match = this.exec(src);
	if (!match) {
		unsafeWindow.megaModErrors.regexErrs.push(...ids);
		console.error(`MegaMod: Exec not found for pattern: ${this}`);
	}
	return match?.map((m, i) => i ? m.replace("_", "\\_").replace("$", "\\$") : m);
};

const editSource = (src) => {
	// Minified Variable Regex
	const v = `[a-zA-Z_$][a-zA-Z0-9_$]*`;

	// Match Grenade Pickups
	let itemManagerClass = new RegExp(`(${v})\\.Constructors`).safeExec(src, "matchGrenades");
	let itemManagerInst, playerArr;
	if (itemManagerClass?.length > 1) {
		itemManagerClass = itemManagerClass[1];
		let itemManagerMatch = new RegExp(`(${v})\\=new\\s${itemManagerClass}`).safeExec(src, "matchGrenades");
		if (itemManagerMatch?.length > 1) {
			itemManagerInst = itemManagerMatch[1];
			let meshVar = new RegExp(`this\\.(${v})\\.rotation\\.y\\+\\=\\.[0-9]+\\*${v}`).safeExec(src, "matchGrenades");
			if (meshVar?.length > 1) {
				meshVar = meshVar[1];
				let playerMatch = new RegExp(`((${v})\\[this\.playerIdx\\])\\;`).safeExec(src, "matchGrenades");
				let newGrenadePool = new RegExp(`new\\s${v}\\(\\(function\\(\\)\{return\\snew\\s${v}\\.Constructors\\[${v}\\.GRENADE\\]\\}\\)\\,20\\)`).safeExec(src, "matchGrenades");
				if (newGrenadePool.length) {
					newGrenadePool = newGrenadePool[0];

					// cloneMesh for other grenades
					let cloneGrenadeMesh = new RegExp(`${v}\\(${v}\\.catalog\\.grenades\\[${v}\\]\\.item_data\\.meshName\\,${v}\\,null\\,${v}\\.getMaterialByName\\(\\"emissive\\"\\)\\)\\.setEnabled\\(\\!1\\)`).safeExec(src, "matchGrenades");
					if (cloneGrenadeMesh.length) {
						cloneGrenadeMesh = cloneGrenadeMesh[0];

						let standardInstancedMesh = cloneGrenadeMesh.safeReplace("emissive", "standardInstanced", "matchGrenades");
						if (standardInstancedMesh) {
							// cloneMesh for other grenades
							src = src.safeReplace(cloneGrenadeMesh, `${standardInstancedMesh};${cloneGrenadeMesh};`, "matchGrenades");
						}

						// ItemManager Class Modifications
						const updateGrenadesFunc = `,
							${itemManagerClass}.prototype.updateGrenades = function() {
								const grenadeData = [];
								const grenadePool = this.pools[${itemManagerClass}.GRENADE];
								grenadePool.forEachActive(item => {
									grenadeData.push({ id: item.id, position: item.${meshVar}.position, rotation: item.${meshVar}.rotation });
									item.remove();
								});
								this.pools[${itemManagerClass}.GRENADE] = ${newGrenadePool};
								grenadeData.forEach(({ id, position, rotation }) => {
									this.spawnItem(id, ${itemManagerClass}.GRENADE, position.x, position.y, position.z);
								});
								grenadePool.forEachActive(item => {
									item.${meshVar}.rotation = grenadeData.find(data => data.id === item.id).rotation;
								});
							},
							${itemManagerClass}.currentGrenadeMesh = "grenadeItem",
							${itemManagerClass}.prototype.tryUpdateGrenades = function(grenadeMesh) {
								let g = "grenadeItem";
								if (extern?.modSettingEnabled?.("matchGrenades")) {
									g = grenadeMesh || extern.account.grenadeItem.item_data.meshName;
								}
								if (g !== ${itemManagerClass}.currentGrenadeMesh) {
									${itemManagerClass}.currentGrenadeMesh = g;
									this.updateGrenades();
									//console.log("Pickup Grenade Updated: " + ${itemManagerClass}.currentGrenadeMesh);
								}
							},
							${itemManagerClass}.getCurrentGrenadeMesh = function() {
								return (extern?.modSettingEnabled?.("matchGrenades")) ? ${itemManagerClass}.currentGrenadeMesh : "grenadeItem";
							}
						`;
						src = src.safeReplace(`,${itemManagerClass}.prototype.spawnItem`, `${updateGrenadesFunc},${itemManagerClass}.prototype.spawnItem`, "matchGrenades");

						if (playerMatch?.length > 2) {
							playerArr = playerMatch[2];
							// updateLegacySkinsInGame() Function
							const updateLegacySkinsFunc = `
								window.extern.updateLegacySkinsInGame = (enabled) => {
									${playerArr}.forEach(player => {
										[player.primaryWeaponItem, player.secondaryWeaponItem].forEach(item => {
											if (LegacyMode.itemIds.includes(item.id)) {
												item.item_data.meshName = enabled ? (item.item_data.meshName.includes("_Legacy") ? item.item_data.meshName : item.item_data.meshName + "_Legacy") : item.item_data.meshName.replace("_Legacy", "");
												player.changeWeaponLoadout(player.primaryWeaponItem, player.secondaryWeaponItem);
											}
										});
									});
								}
							`;
							// Adding tryUpdateGrenades() and updateLegacySkinsInGame() to extern
							src = src.safeReplace(itemManagerMatch[0], `${itemManagerMatch[0]},${updateLegacySkinsFunc},window.extern.tryUpdateGrenades=${itemManagerInst}.tryUpdateGrenades.bind(${itemManagerInst})`, ["matchGrenades", "legacyMode_skins"]);
						}

						// Initial Custom Grenade
						src = src.safeReplace(`switchToGameUi(),`, `switchToGameUi(), extern.tryUpdateGrenades(),`, "matchGrenades");
						src = src.safeReplace(`getMeshByName("grenadeItem"`, `getMeshByName(${itemManagerClass}.getCurrentGrenadeMesh()`, "matchGrenades");

						// Calling checkCurrentGrenadeMesh() when updating loadout
						src = src.safeReplace("generateLoadoutObject();", `generateLoadoutObject();if(extern.inGame){extern.tryUpdateGrenades();}`, "matchGrenades");

						// Calling checkCurrentGrenadeMesh() during first-person spectate
						let specMatches = src.matchAll(new RegExp(`this\\.spectatePlayer\\(${v}\\)`, 'g'));
						if (playerMatch && specMatches) {
							specMatches.forEach(m => {
								src = src.safeReplace(m, `(${m}, extern.tryUpdateGrenades(${playerMatch[1]}.grenadeItem.item_data.meshName))`, "matchGrenades", true);
							});
						} else unsafeWindow.megaModErrors.regexErrs.push("matchGrenades");

						// Calling checkCurrentGrenadeMesh() when exiting first-person spectate
						src = src.safeReplace(`.freeCamera()`, `.freeCamera(),${itemManagerInst}.tryUpdateGrenades()`, "matchGrenades");
					}
				}
			}
		}
	}

	// Photobooth Spin
	let paperDollMatch = new RegExp(`(${v})\\.prototype.poseWithItems`).safeExec(src, "pbSpin");
	if (paperDollMatch?.length > 1) {
		let paperDollClass = paperDollMatch[1];
		let pdActorVar = new RegExp(`dualAvatar\\.(${v})\\.setupStowAnims`).safeExec(src, "pbSpin");
		if (pdActorVar?.length > 1) {
			pdActorVar = pdActorVar[1];
			let pdMeshVar = new RegExp(`dualAvatar\\.${pdActorVar}\\.(${v})\\.scaling`).safeExec(src, "pbSpin");
			if (pdMeshVar?.length > 1) {
				pdMeshVar = pdMeshVar[1];
				let pdInstanceMatch = new RegExp(`(${v})\\=new ${paperDollClass}`).safeExec(src, "pbSpin");
				if (pdInstanceMatch?.length > 1) {
					let pdInstanceVar = pdInstanceMatch[1];
					const spinEggFuncs = `
						${paperDollClass}.prototype.spinning = false,
						${paperDollClass}.prototype.spinEgg = function(time, steps, frameFunc) {
							const meshY = this.avatar.${pdActorVar}.${pdMeshVar}.rotation.y;
							const headY = this.avatar.${pdActorVar}.head.rotation.y;
							const oldUpdate = this.update;
							this.update = () => {};
							const frameDelay = time / steps;
							let currentStep = 0;

							if (this.spinning) return;
							this.spinning = true;
							
							if (frameFunc) window.megaMod.photoboothEggSpin.setupGIF();
							const spinInterval = setInterval(() => {
								this.avatars(a => {
									// Calculate rotation angle and wrap back to 0 after 2π
									a.${pdActorVar}.${pdMeshVar}.rotation.y = (a.${pdActorVar}.${pdMeshVar}.rotation.y + Math.PI2 / steps) % Math.PI2;
								});
								const lastFrame = ++currentStep >= steps;
								if (frameFunc) frameFunc(frameDelay, lastFrame);
								if (lastFrame) {
									this.spinning = false;
									this.avatars((a) => {
										a.${pdActorVar}.${pdMeshVar}.rotation.y = meshY;
										a.${pdActorVar}.head.rotation.y = headY;
									});
									this.update = oldUpdate;
									clearInterval(spinInterval);
								}
							}, frameDelay);
						}
					`;
					src = src.safeReplace(paperDollMatch[0], `${spinEggFuncs},${paperDollMatch[0]}`, "pbSpin");
					src = src.safeReplace(pdInstanceMatch[0], `${pdInstanceMatch[0]},extern.spinEgg=${pdInstanceVar}.spinEgg.bind(${pdInstanceVar})`, "pbSpin");
				}
			}
		}
	}

	// Custon Skybox
	let skyboxMatch = new RegExp(`\\"img\\/skyboxes\\/\\"\\+(${v})`).safeExec(src, "customSkybox");
	if (skyboxMatch?.length) {
		let cubeTextureMatch = new RegExp(`\\.reflectionTexture=new.*?\\)`).safeExec(src, "customSkybox");
		src = src.safeReplace(skyboxMatch[0], `(extern?.modSettingEnabled?.("customSkybox") ? extern.getSkybox() : ${skyboxMatch[0]})`, "customSkybox");
		let skyboxVar = new RegExp(`(${v})\\.infiniteDistance\\=\\!0\\;`).safeExec(src, "customSkybox");
		if (cubeTextureMatch?.length && skyboxVar?.length > 1) {
			src = src.safeReplace(skyboxVar[0], `${skyboxVar[0]}window.megaMod.setSkybox(${skyboxVar[1]});`, "customSkybox")
			cubeTextureMatch = `window.megaMod.customSkybox.skybox.material${cubeTextureMatch[0]}`;
			let customCubeTexture = cubeTextureMatch.safeReplace(skyboxMatch[0], `extern.getSkybox()`, "customSkybox");

			let mapDataVar = new RegExp(`(${v})\\.skybox\\|\\|`).safeExec(src, "customSkybox");
			if (mapDataVar?.length > 1) {
				mapDataVar = mapDataVar[1];
				cubeTextureMatch = cubeTextureMatch.safeReplace(`+${skyboxMatch[1]}+`, `+${mapDataVar}.skybox+`, "customSkybox");
				let color3Var = new RegExp(`red\\:new\\s(${v})\\(`).safeExec(src, ["customSkybox"]);
				let skyboxModeVar = new RegExp(`\\.TEXTURE_SKYBOX_MODE\\=([a-zA-Z0-9"][a-zA-Z0-9"]*)`).safeExec(src, "customSkybox");
				if (color3Var?.length > 1 && skyboxModeVar?.length > 1) {
					color3Var = color3Var[1];
					skyboxModeVar = skyboxModeVar[1];
					const skyboxFunc = `
						updateSkybox: (enabled = false, r = 0, g = 0, b = 0) => {
							const skybox = window.megaMod.customSkybox?.skybox;
							if (!skybox) return;
							if (!enabled || !window.megaMod.customSkybox.usingSkyboxColor) r = g = b = 0;
							skybox.material.emissiveColor = new ${color3Var}(r / 255, g / 255, b / 255);
							if (enabled && !window.megaMod.customSkybox.usingSkyboxColor) {
								${customCubeTexture};
							} else {
								${cubeTextureMatch};
								skybox.material.reflectionTexture = enabled ? null : skybox.material.reflectionTexture;
							}
							if (skybox.material.reflectionTexture) skybox.material.reflectionTexture.coordinatesMode = ${skyboxModeVar}; // BABYLON.Texture.SKYBOX_MODE --> 5
						}
					`;
					src = src.safeReplace("catalog:", `${skyboxFunc},catalog:`, "customSkybox");
					src = src.safeReplace("vueApp.hideLoadingScreenAd()", "vueApp.hideLoadingScreenAd(), (window.megaMod.customSkybox.usingSkyboxColor && window.megaMod.customSkybox.onSkyboxCategoryChanged('colors'))", "customSkybox");
				}
			}
		}
	}

	// Spectate Speed
	src = src.safeReplace(".016*", `.016*extern.getSpecSpeed()*`, "specTweaks_speedSlider", true);
	src = src.safeReplace(".008*", `.008*extern.getSpecSpeed()*`, "specTweaks_speedSlider", true);

	// Color Slider Non-VIP Fix
	const vipCheckMatch = new RegExp(`\\!${v}\\.playerAccount\\.isSubscriber`).safeExec(src, "colorSlider");
	if (vipCheckMatch?.length) {
		src = src.safeReplace(vipCheckMatch[0], `${vipCheckMatch[0]} && !extern?.usingSlider?.()`, "colorSlider");
	}

	// VIP Slider Color In-Game Init
	let mePlayerVar = new RegExp(`\\((${v})\\=(${v})\\)\\.ws`).safeExec(src, "colorSlider");
	if (mePlayerVar?.length > 2) {
		const actorVar = new RegExp(`${mePlayerVar[1]}\\.(${v})\\.hit\\(\\)`).safeExec(src, "colorSlider");
		if (actorVar) {
			src = src.safeReplace(mePlayerVar[0], `(extern?.usingSlider?.() && vueApp.equip.colorIdx === 14 && ${mePlayerVar[2]}.${actorVar[1]}.setShellColor(14)), ${mePlayerVar[0]}`, "colorSlider");
		}
	}
	src = src.safeReplace("this.upgradeExpiryDate:", "(this.upgradeExpiryDate || extern?.usingSlider?.() && this.colorIdx === 14):", "colorSlider");

	// Freeze Frame
	let freezeVar = new RegExp(`\\"\\\\\\\\"\\=\\=${v}\\)\\{(${v})\\=\\!0`).safeExec(src, "specTweaks_freezeKeybind");
	// Gamemodes go out of sync
	//let freezeVarKotc = new RegExp(`removeAll\\(\\)\\,(${v})\\=\\!0`).safeExec(src, "specTweaks_freezeKeybind");
	if (freezeVar?.length > 1 /*&& freezeVarKotc?.length > 1*/) {
		freezeVar = freezeVar[1];
		//freezeVarKotc = freezeVarKotc[1];
		const freezeFunc = `
			freezeFrame: (enabled) => {
				${freezeVar} = enabled;	
				// freezeVarKotc = enabled;
				// window.megaMod.spectateTweaks.frozen = enabled;
			}
		`;
		src = src.safeReplace("catalog:", `${freezeFunc},catalog:`, "specTweaks_freezeKeybind");

		/*
		// This bugs the game because things aren't synced after un-freeze
		let freezeMatch = new RegExp(`isMoreDataAvailable\\(\\)\\;\\)\\{`).safeExec(src, "specTweaks_freezeKeybind");
		if (freezeMatch?.length) {
			freezeMatch = freezeMatch[0];
			src = src.safeReplace(freezeMatch, `${freezeMatch}if (window.megaMod.spectateTweaks.frozen)break;`, "specTweaks_freezeKeybind");
		}
		*/
	}

	// Hide Nametags, Outlines, & Pickups
	const teamColorsMatch = RegExp(`(${v})\\.outline\\[`).safeExec(src, ["hideHUD_nametags", "hideHUD_outlines", "betterUI_chat"]);
	if (teamColorsMatch?.length > 1 && itemManagerInst && itemManagerClass) {
		const hideHUDFuncs = `
			hideNametags: (hide) => ${teamColorsMatch[1]}.textColor.forEach(c => c.a = +!hide),
			hideOutlines: (hide) => ${teamColorsMatch[1]}.outline.forEach((c, i) => c.a = (!hide && i) ? 0.3 : -1),
			hidePickups: (hide) => ${itemManagerInst} && (${itemManagerInst}.itemsHidden = hide)
		`;
		src = src.safeReplace("catalog:", `${hideHUDFuncs},catalog:`, ["hideHUD_nametags", "hideHUD_outlines", "hideHUD_pickups"]);
		src = src.safeReplace(`,${itemManagerClass}.prototype.spawnItem`, `${itemManagerClass}.itemsHidden=false,${itemManagerClass}.prototype.spawnItem`, "hideHUD_pickups");
		const pickupMeshVar = new RegExp(`(${v}\\.${v})\\.isVisible\\=(${v}\\(\\1\\))\\}\\)`).safeExec(src, "hideHUD_pickups");
		if (pickupMeshVar?.length > 2) {
			const newPickupMeshVar = `${pickupMeshVar[0].safeReplace(pickupMeshVar[2], `!this.itemsHidden && ${pickupMeshVar[2]}`, "hideHUD")}.bind(this)`
			src = src.safeReplace(pickupMeshVar[0], newPickupMeshVar, "hideHUD_pickups");
		}
	}
	
	// Hit Indicator Color
	src = src.safeReplace("this.colors[0]=1", `this.colors[0]=1, (extern?.modSettingEnabled?.("betterUI_hitMarkers") && (this.colors[1]=this.colors[5]=this.colors[9]=.9))`, "betterUI_hitMarkers");

	const hitIndicatorFunc = `
		switchColor(enabled) {
			const colors = new Array(12).fill(0);
			[0, 4, 8, 7].forEach(index => colors[index] = 1);
			[1, 5, 9].forEach(index => colors[index] = enabled ? 0.9 : 0);
			this.markers.forEach(t => t.mesh.updateVerticesData("color", colors)); // BABYLON.VertexBuffer.ColorKind --> "color";
		}
	`;
	src = src.safeReplace("resize(){", `${hitIndicatorFunc}resize(){`, "betterUI_hitMarkers");

	const markerMatch = new RegExp(`${v}\\.hitMarkers\\?(${v})\\.show`).safeExec(src, "betterUI_hitMarkers");
	if (markerMatch?.length > 1) {
		src = src.safeReplace("catalog:", `switchHitMarkerColor: (enabled) => ${markerMatch[1]}.switchColor(enabled),catalog:`, "betterUI_hitMarkers");
	}

	// Longer Chat
	const chatMatch = new RegExp(`\\}${v}\\.length\\>4`).safeExec(src, "");
	if (chatMatch?.length) {
		src = src.safeReplace(chatMatch[0], chatMatch[0].replace(`>4`, `>(extern?.modSettingEnabled?.("betterUI_chat") ? 6 : 4)`));
	}

	const playerClickMatch = new RegExp(`onclick\\=(${v})\\(${v}\\.uniqueId\\,${v}\\,${v}\\)`).safeExec(src, "");
	const socialFuncMatch = new RegExp(`(${v})\\(${v}\\.social\\)`).safeExec(src, "");
	// Chat Events 
	if (teamColorsMatch?.length > 1 && playerClickMatch?.length > 1 && socialFuncMatch?.length > 1) {
		const chatEventFunc = `
			function addChatEvent (type, player) {
				if (!Object.values(ChatEvent).includes(type) || !player || !extern?.modSettingEnabled?.(ChatEventData[type].setting)) return;
				
				const chatOut = document.getElementById("chatOut");
				const notMePlayer = !player.ws;
				
				const chatItem = document.createElement("div");
				chatItem.classList.add("chat-item", "chat-event", \`type-\${type}\`);
				if (notMePlayer) chatItem.classList.add("clickme");
				chatItem.style.fontStyle = "italic";
				if (notMePlayer) {
					const ISVIP = !player.hideBadge && player?.upgradeProductId > 0;
					const GETSOCIALMEDIA = !player.hideBadge && ${socialFuncMatch[1]}(player.social);
					chatItem.onclick = ${playerClickMatch[1]}(player.uniqueId, GETSOCIALMEDIA, ISVIP);
				}
				
				const nameDiv = document.createElement("div");
				Object.assign(nameDiv.style, { display: "inline-block", color: ${teamColorsMatch[1]}.text[player.team] });
				
				const eventIcon = document.createElement("i");
				eventIcon.classList.add("fas", "fa-info-circle", "ss_marginright_xs");
				
				const nameSpan = document.createElement("span");
				nameSpan.classList.add("chat-player-name");
				nameSpan.textContent = player.name;
				nameDiv.append(eventIcon, nameSpan);
				
				const msgContent = document.createElement("span");
				switch(type) {
					case ChatEvent.switchTeam:
						const teamText = document.createElement("span");
						teamText.style.color = nameDiv.style.color;
						teamText.textContent = vueApp.loc[teamLocs[player.team - 1]];
						msgContent.innerHTML = vueApp.loc[ChatEventData[type].loc].format(teamText.outerHTML);
						break;
					default:
						msgContent.textContent = vueApp.loc[ChatEventData[type].loc];
				}
				
				chatItem.append(nameDiv, msgContent);
				chatOut.appendChild(chatItem);

				const chatItems = Array.from(chatOut.querySelectorAll(".chat-item"));
				chatItems.slice(0, Math.max(0, chatItems.length - 7)).forEach(item => item.remove());
			}
			let clientReady = false;
		`;
		src = src.safeReplace("window.BAWK", `${chatEventFunc}window.BAWK`, "");
	}
	if (src.indexOf("clientReady = false;") !== -1) {
		src = src.safeReplace(`.gameJoined:`, `.gameJoined:clientReady = false;`, "");
		src = src.safeReplace(`.clientReady:`, `.clientReady:clientReady = true;`, "");
		
		const joinPlayerMatch = new RegExp(`(${v}).${v}\\|\\|\\1\\.${v}\\.removeFromPlay\\(\\)`).safeExec(src, "");
		if (joinPlayerMatch?.length > 1) {
			const playerVar = joinPlayerMatch[1];
			src = src.safeReplace(joinPlayerMatch[0], `if (clientReady) addChatEvent(ChatEvent.joinGame, ${playerVar});${joinPlayerMatch[0]}`, "");
		}
	}

	const leavePlayerMatch = new RegExp(`\\b(?!this\\b)(${v})\\.${v}\\.remove\\(\\)`).safeExec(src, "");
	if (leavePlayerMatch?.length > 1) {
		const playerVar = leavePlayerMatch[1];
		src = src.safeReplace(leavePlayerMatch[0], `${leavePlayerMatch[0]},addChatEvent(ChatEvent.leaveGame, ${playerVar})`, "");
	}

	const switchPlayerMatch = new RegExp(`(${v})\\.stats\\.kills\\=0`).safeExec(src, "");
	if (switchPlayerMatch?.length > 1) {
		const playerVar = switchPlayerMatch[1];
		src = src.safeReplace(switchPlayerMatch[0], `addChatEvent(ChatEvent.switchTeam, ${playerVar}),${switchPlayerMatch[0]}`, "");
	}

	// SERVER and MOD Chat Icons
	let iconVar = new RegExp(`(${v})\\.classList\\.add\\(\\"fab\\"`).safeExec(src, "");
	if (iconVar?.length > 1) {
		iconVar = iconVar[1];
		let nameDivVar = new RegExp(`(${v})\\.style\\.display\\=\\"inline-block\\"(?:\r|\n|.)*\\1\\.style\\.color\\=\\"#ff0\\"`).safeExec(src, "");
		if (nameDivVar?.length > 1) {
			nameDivVar = nameDivVar[1];
			const chatIcon = `(${iconVar}.classList.add({CLASS}, "ss_marginright_xs", "chat-icon"), ${nameDivVar}.appendChild(${iconVar}))`
			src = src.safeReplace(`"SERVER: "`, `"SERVER: ",${chatIcon.replace("{CLASS}", `"far6", "fa-globe"`)}`, ``);
			src = src.safeReplace(`"MOD: "`, `"MOD: ",${chatIcon.replace("{CLASS}", `"fas", "fa-shield-alt"`)}`, ``);
		}
	}

	// First-Person Spectate Controls
	const updownKeybinds = `extern?.modSettingEnabled?.('specTweaks_updown')`;
	const spectateControls = "vueApp.settingsUi.controls.keyboard.spectate";
	src = src.safeReplace(`"ARROWUP"`, `((${updownKeybinds})? ${spectateControls}[${spectateControls}.findIndex(i => i.id === "ascend")].value : "ARROWUP")`, "");
	src = src.safeReplace(`"ARROWDOWN"`, `((${updownKeybinds}) ? ${spectateControls}[${spectateControls}.findIndex(i => i.id === "descend")].value : "ARROWDOWN")`, "");
	
	// All done...yay! :)
	return src;
};