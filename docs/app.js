import { PassManager, SimpleTimer, PassFile } from "./pass.js";
import { CacheKeys, CacheManager } from "./cacher.js";
import { IntroPage, DropPage, KeyPage, MainPage, EditPage, LoginPage } from "./pages.js";
import { documentCreateElement, Element, DraggableMenu } from "./components.js";
import { Fire } from "./fire.js";

export class MobileAppWIP {
    constructor() {
        this.main = new Element("id", "main");
        this.mainWrapper = new Element("id", "main-wrapper");
    }

    start() {
        this.mainWrapper.delete();
        let messageBlock = documentCreateElement("div", null, "v vh-c hv-c".split(" "));

        messageBlock.innerHTML = '<div id="main-panel-loading" class="large-grid-loader"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';

        let message = documentCreateElement("div");
        message.style.paddingTop = "40px";
        message.innerHTML = "Work In Progress"
        messageBlock.appendChild(message);

        let message2 = documentCreateElement("div");
        message2.style.paddingTop = "40px";
        message2.innerHTML =  "Try it on Desktop! 🖥️"
        messageBlock.appendChild(message2);

        this.main.getElement().appendChild(messageBlock);
        this.main.show();
    }
}

export class App {
    constructor() {
        this.fire = new Fire();
        this.fireLoggedIn = false;

        this.passManager = new PassManager(this);
        this.cacheManager = new CacheManager(this);

        this.main = new Element("id", "main");
        this.mainPanel = new Element("id", "main-panel");
        this.mainLoading = new Element("id", "main-panel-loading");

        this.draggableMenu = new DraggableMenu(this, null);

        this.pages = {
            DropPage: new DropPage(this), 
            LoginPage: new LoginPage(this),
            MainPage: new MainPage(this),
            EditPage: new EditPage(this),
            KeyPage: new KeyPage(this),
            IntroPage: new IntroPage(this)
        };
        
        this.shownPage = null;

        this.keyCreated = false;

        this.rawPassFile = null;
        this.passFile = null;

        this.COLOR_MODE = {
            LIGHT: "light-mode",
            DARK: "dark-mode"
        }

        this.currentColorMode = this.cacheManager.retrieveInitialValueAndStore(CacheKeys.COLOR_THEME);
        this.setColorMode(this.currentColorMode);

        this.CONSTANTS = {
            DOWNLOAD_FILE_NAME: "pass.txt",
            APP_TOKEN: "appToken",

            // URL Regex https://regexr.com/3e6m0
            WEBSITE_REGEXP: /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,

            PASS_CACHE_DURATION_SECS: this.passManager.CACHE_MASTER_KEY_DURATION_MS / 1000,
        }

        this.passCacheTimer = new SimpleTimer(this.CONSTANTS.PASS_CACHE_DURATION_SECS);
    }

    start() {
        this.setup();
        this.main.show();
    }

    setup(){
        this.setupDraggableMenu();
        Object.values(this.pages).forEach(p => p.setup());
        this.mainLoading.hide();

        this.pages.LoginPage.show();
        // this.pages.IntroPage.show();
        // this.pages.DropPage.show();
        // this.pages.KeyPage.show();
        // this.pages.MainPage.show();
        // this.pages.EditPage.show();
        // this.___DEBUG_MAIN_PAGE();
    }

    setupDraggableMenu() {
        let draggableMenu = this.draggableMenu.create();
        this.main.getElement().appendChild(draggableMenu);
        this.draggableMenu.setup();
    }

    disableDraggableMenuBackButton() {
        this.draggableMenu.backButton.disable();
    }

    enableDraggableMenuBackButton() {
        this.draggableMenu.backButton.enable();
    }

    disableDraggableMenuHomeButton() {
        this.draggableMenu.homeButton.disable();
    }

    enableDraggableMenuHomeButton() {
        this.draggableMenu.homeButton.enable();
    }

    toggleLightDarkMode() {
        if(this.currentColorMode === CacheKeys.COLOR_THEME.LIGHT) {
            this.currentColorMode = CacheKeys.COLOR_THEME.DARK;
        } else {
            this.currentColorMode = CacheKeys.COLOR_THEME.LIGHT;
        }
        this.setColorMode(this.currentColorMode);
        this.storeColorMode(this.currentColorMode);
    }

    setColorMode(mode) {
        Object.values(this.COLOR_MODE).forEach(mode => {
            document.body.classList.remove(mode);
        })
        document.body.classList.add(this.COLOR_MODE[mode]);
        this.draggableMenu.setLightDarkModeButtonIcon();
    }

    retrieveColorMode() {
        return this.cacheManager.retrieve(CacheKeys.COLOR_THEME);
    }

    storeColorMode(colorMode) {
        this.cacheManager.store(CacheKeys.COLOR_THEME, colorMode);
    }

    // FIRE
    async createNewFireAccount(email, password) {
        this.mainLoading.show();
        await this.fire.createNewAccount(email, password).then(async () => {
            this.fireLoggedIn = true;

            this.pages.LoginPage.clearPasswordInput();
            await this.RESET_PASS_MANAGER();
            this.goToIntroPage(null);
        }).catch((e) => {
            debugLog(e);
            this.goToLoginPage(null);
            throw e;
        });
    }

    async signInFireAccount(email, password) {
        this.mainLoading.show();
        await this.fire.signInAccount(email, password).then(async () => {
            this.fireLoggedIn = true;
            
            this.pages.LoginPage.clearPasswordInput();
            
            let passEntries = await this.fire.getAllPassEntries();
            if(passEntries && passEntries.length > 0) {
                await this.RESET_PASS_MANAGER();
                this.passManager.setEntries(passEntries);
                this.keyCreated = true;

                this.goToMainPage(null);
            } else {
                this.goToIntroPage(null);
            }
        }).catch((e) => {
            debugLog(e);
            this.goToLoginPage(null);
            throw e;
        });
    }

    async signOutFireAccount() {
        if(this.isFireLoggedIn()) {
            await this.fire.signOutAccount().then(async () => {
                this.fireLoggedIn = false;
                await this.RESET_PASS_MANAGER(false);
                this.goToLoginPage(null);
            }).catch((e) => {
                debugLog(e);
                this.goToLoginPage(null);
                throw e;
            });
        } else {
            debugLog("No user logged in fire")
        }
    }

    isFireLoggedIn() {
        return this.fireLoggedIn;
    }

    ___DEBUG_MAIN_PAGE() {
        // FOR DEBUGGING
        let testEntryStrings = ['Fb[|]website.com[|]user[|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', 'Google[|]website.com[|][|]something[|]hehe[|]pass[|][|]what[*]the[*]heck[|]comment[*]here', 'What[|]website.com[|][|]something[|]hehe[|]pass[|][|]what[*]the[*]heck[|]'];
        let e = this.passManager.entriesFromStrings(testEntryStrings);
        this.passManager.setEntries(e);

        this.goToMainPage(null);
    }

    async RESET_PASS_MANAGER(generateSecrets = true) {
        debugLog("Resetting all pass data");
        this.pages.MainPage.reset();
        this.pages.EditPage.reset();
        this.pages.KeyPage.reset();
        await this.passManager.RESET(generateSecrets);
    }

    getPassManagerEntries() {
        return this.passManager.getEntries();
    }

    searchPassManagerEntries(searchText) {
        let rankedEntries = this.passManager.searchEntries(searchText);
        this.pages.MainPage.updateMainTableEntries(rankedEntries);
    }

    hideAllPages() {
        Object.values(this.pages).forEach(p => p.hide());
        this.mainLoading.hide();
    }

    async savePasswordToPassManager(pw, referringPage, callBack) {
        this.keyCreated = true;
        this.hideAllPages();
        this.mainLoading.show();
        
        this.passManager.saveMasterPasswordToHash(pw);

        if(callBack) { //callback after saving password 
            await callBack(referringPage);
        } else {
            this.goToMainPage(null);
        }
    }

    extractRawPassFile(referringPage) {
        this.hideAllPages();

        if(!this.rawPassFile) throw new Error("no rawPassFile found");

        let fr = new FileReader();
        
        fr.readAsText(this.rawPassFile);
        
        fr.onload = async () => {
            this.mainLoading.show();

            let passFile = new PassFile(fr.result);

            if(passFile.isEncrypted()) {
                try {
                    passFile.decryptFileAndProcess(this.CONSTANTS.APP_TOKEN);
                } catch (e) {
                    debugLog("Something went wrong with decrypting passFile")
                    debugLog(e);
                    this.rawPassFile = null;
                    this.pages.DropPage.show(); //go back to drop page without setting referring page
                    return;
                }
            }

            this.passFile = passFile;

            await this.RESET_PASS_MANAGER();
            this.passManager.saveSecrets(this.passFile.getFirst(), this.passFile.getLast());

            //we overwrite/save any fs for the logged-in user since that's needed to decrypt entries
            await this.fire.setFileSecret(this.passFile.getFirst()).then(() => {
                debugLog("fs uploaded to fire!");
            }).catch((error) => {
                handleAppErrorType(error, AppErrorType.FIRE.NO_USER_SIGNED_IN, () => {
                    debugLog("No signed in user, fs not saved to fire");
                });
            });

            try {
                let entries = this.passManager.entriesFromStrings(this.passFile.getRawEntries());
                if(this.fire.validateFireUser(false)) {
                    let len = entries.length;
                    entries.forEach((entry, index) => {
                        this.fire.addOrSetPassEntry(entry);
                        debugLog(index + " out of " + len + " uploaded");
                    })
                }
                this.passManager.setEntries(entries);
            } catch (e) {
                debugLog("Something went wrong with parsing passFile");
                debugLog(e);
                this.rawPassFile = null;
                this.pages.DropPage.show(); //go back to drop page without setting referring page
                return;
            }
            this.goToKeyPage(referringPage);
        };
    }

    setRawPassFile(rawPassFile){
        this.rawPassFile = rawPassFile;
    }

    getRawPassFile() {
        return this.rawPassFile;
    }

    //https://robkendal.co.uk/blog/2020-04-17-saving-text-to-client-side-file-using-vanilla-js
    downloadPassFile() {
        let downloadPassFile = this.passManager.getPassFileFromEntries(true);

        let a = documentCreateElement('a');
        let file = new Blob([downloadPassFile.getRaw()], {type: 'text/plain'});
            
        a.href = URL.createObjectURL(file);
        a.download = this.CONSTANTS.DOWNLOAD_FILE_NAME;
        a.click();
          
        URL.revokeObjectURL(a.href);
    }

    async addPassEntry(input, referringPage) {
        this.hideAllPages();
        this.mainLoading.show();
        this.disableDraggableMenuBackButton();

        // https://stackoverflow.com/questions/14367168/css-animations-stall-when-running-javascript-function
        try {
            await this.passManager.addPassEntry(input); //wait for web worker completion
        } catch (e) {
            handleAppErrorType(e, AppErrorType.MISSING_MASTER_PASSWORD, () => {
                let callBackAfterKeyEntered = (refPage) => {
                    this.addPassEntry(input, refPage);
                };
                this.goToKeyPage(referringPage, callBackAfterKeyEntered);
            });
            return;
        }
        this.pages.EditPage.reset();
        this.goToMainPage(null);
    }

    async editPassEntry(entryTag, input, referringPage) {
        this.hideAllPages();
        this.mainLoading.show();
        this.disableDraggableMenuBackButton();

        try {
            await this.passManager.editPassEntry(entryTag, input); //wait for web worker completion
        } catch (e) {
            handleAppErrorType(e, AppErrorType.MISSING_MASTER_PASSWORD, () => {
                let callBackAfterKeyEntered = (refPage) => {
                    this.editPassEntry(entryTag, input, refPage);
                };
                this.goToKeyPage(referringPage, callBackAfterKeyEntered);
            });
            return;
        }

        this.pages.EditPage.completeEditEntry();
        this.pages.EditPage.reset();
        this.goToMainPage(null);
    }

    confirmEditPageEntry(entry, referringPage) {
        this.pages.EditPage.setReferringPage(referringPage);
        this.pages.EditPage.confirmEditEntry(entry);
    }

    async deleteEntry(entry, referringPage) {
        await this.passManager.deletePassEntry(entry);
        this.goToMainPage(null);
    }

    async decryptPassEntryField(field, content, referringPage, component) {
        let decryptedField;
        this.disableDraggableMenuBackButton();

        try {
            decryptedField = await this.passManager.decryptPassEntryField(field, content); //wait for web worker completion
        } catch (e) {
            handleAppErrorType(e, AppErrorType.MISSING_MASTER_PASSWORD, () => {
                let callBackAfterKeyEntered = () => {
                    component.getElement().click();
                    this.goToMainPage(null, false);
                };
                this.goToKeyPage(referringPage, callBackAfterKeyEntered);
                throw new AppError("Redirecting to key page before decrypting", AppErrorType.MISSING_MASTER_PASSWORD);
            });
            return;
        }
        return decryptedField;
    }

    forceEncryptMainTable() {
        this.pages.MainPage.forceEncrypt();
    }

    CLEAR_CACHED_MASTER_KEY() {
        this.passManager.DESTROY_CACHED_MASTER_KEY(false);
    }

    REFRESH_CACHED_MASTER_KEY_TIMEOUT() {
        this.passManager.RESET_DESTROY_CACHED_MASTER_KEY_TIMEOUT();
    }

    async generateMasterKeyForIndicator(referringPage, component) {
        this.disableDraggableMenuBackButton();

        try {
            await this.passManager.generateMasterKey();
        } catch (e) {
            handleAppErrorType(e, AppErrorType.MISSING_MASTER_PASSWORD, () => {
                let callBackAfterKeyEntered = async () => {
                    component.getElement().click();
                    this.goToMainPage(null, false);
                    this.disableDraggableMenuHomeButton();
                };
                this.goToKeyPage(referringPage, callBackAfterKeyEntered);
            });
            return;
        }
    }


    goToLoginPage(referringPage) {
        this.pages.LoginPage.setReferringPage(referringPage);
        this.pages.LoginPage.show();
    }

    goToIntroPage(referringPage) {
        this.pages.IntroPage.setReferringPage(referringPage);
        this.pages.IntroPage.show();
    }

    goToEditPage(action, referringPage, editEntry = null) { //go to edit page with a set action (edit or add)
        this.pages.EditPage.setReferringPage(referringPage);
        this.pages.EditPage.setAction(action);
        this.pages.EditPage.setEditObject(editEntry);
        this.pages.EditPage.show();
    }

    goToMainPage(referringPage, update = true) {
        this.pages.MainPage.setReferringPage(referringPage);
        this.pages.MainPage.show(update);
    }

    goToDropPage(referringPage) {
        this.pages.DropPage.setReferringPage(referringPage);
        this.pages.DropPage.show();
    }

    goToKeyPage(referringPage, callBackAfterKeyEntered) {
        this.pages.KeyPage.setReferringPage(referringPage);
        this.pages.KeyPage.setCallBackAfterKeyEntered(callBackAfterKeyEntered);
        this.pages.KeyPage.show();
    }
}