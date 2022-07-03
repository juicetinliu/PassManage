class App {
    constructor() {
        this.passManager = new PassManager(this);

        this.appToken = "password";

        this.main = new Element("id", "main");
        this.mainPanel = new Element("id", "main-panel");
        this.mainLoading = new Element("id", "main-panel-loading");

        this.draggableMenu = new DraggableMenu(this, null);

        this.pages = {
            DropPage: new DropPage(this), 
            LoginPage: new LoginPage(this), 
            MainPage: new MainPage(this),
            EditPage: new EditPage(this),
            IntroPage: new IntroPage(this)
        };

        this.shownPage = null;

        Object.values(this.pages).forEach(p => p.setAppPages(this.pages));

        this.keyCreated = false;

        this.rawPassFile = null;
        this.passFile = null;

        this.DOWNLOAD_FILE_NAME = "pass.txt"
        
        // URL Regex https://regexr.com/3e6m0
        this.WEBSITE_REGEXP = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;

        this.CACHE_DURATION_S = this.passManager.CACHE_MASTER_KEY_DURATION_MS / 1000;
        this.passCacheTimer = new SimpleTimer(this.CACHE_DURATION_S);

        this.colorModes = {
            LIGHT: "light-mode",
            DARK: "dark-mode"
        }
        this.currentColorMode = this.colorModes.LIGHT;
    }

    run() {
        this.setup();
        this.transitionFromIntro();
        this.main.show();
    }

    setup(){
        this.setupDraggableMenu();
        Object.values(this.pages).forEach(p => p.setup());
        this.mainLoading.hide();

        this.pages.IntroPage.show();
        // this.pages.DropPage.show();
        // this.pages.LoginPage.show();
        // this.pages.MainPage.show();
        // this.pages.EditPage.show();
        // this.___DEBUG_MAIN_PAGE();
    }

    setupDraggableMenu() {
        let draggableMenu = this.draggableMenu.create();
        this.main.getElement().appendChild(draggableMenu);
        this.draggableMenu.setup();
    }

    disableDraggbleMenuBackButton() {
        this.draggableMenu.backButton.disable();
    }

    enableDraggbleMenuBackButton() {
        this.draggableMenu.backButton.enable();
    }

    disableDraggbleMenuHomeButton() {
        this.draggableMenu.homeButton.disable();
    }

    enableDraggbleMenuHomeButton() {
        this.draggableMenu.homeButton.enable();
    }

    toggleLightDarkMode() {
        if(this.currentColorMode === this.colorModes.LIGHT) {
            this.currentColorMode = this.colorModes.DARK;
            document.body.classList.remove(this.colorModes.LIGHT);
            document.body.classList.add(this.currentColorMode);
        } else {
            this.currentColorMode = this.colorModes.LIGHT;
            document.body.classList.remove(this.colorModes.DARK);
            document.body.classList.add(this.currentColorMode);
        }
    }

    ___DEBUG_MAIN_PAGE() {
        // FOR DEBUGGING
        let testEntryStrings = ['Fb[|]website.com[|]user[|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', 'Google[|]website.com[|][|]something[|]hehe[|]pass[|][|]what[*]the[*]heck[|]comment[*]here', 'What[|]website.com[|][|]something[|]hehe[|]pass[|][|]what[*]the[*]heck[|]', ];
        let e = this.passManager.entriesFromStrings(testEntryStrings);
        this.passManager.setEntries(e);

        this.goToMainPage(null);
    }

    RESET_PASS_MANAGER() {
        this.passManager.RESET();
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
        
        fr.onload = function() {
            this.mainLoading.show();

            let passFile = new PassFile(fr.result);

            if(passFile.isEncrypted()) {
                try {
                    passFile.decryptFileAndProcess(this.appToken);
                } catch (e) {
                    console.log("Something went wrong with decrypting passFile")
                    console.log(e);
                    this.rawPassFile = null;
                    this.pages.DropPage.show(); //go back to drop page without setting referring page
                    return;
                }
            }

            this.passFile = passFile;

            this.passManager.saveSecrets(this.passFile.getFirst(), this.passFile.getLast());

            try {
                this.passManager.setEntries(this.passManager.entriesFromStrings(this.passFile.getRawEntries()));
            } catch (e) {
                console.log("Something went wrong with parsing passFile");
                console.log(e);
                this.rawPassFile = null;
                this.pages.DropPage.show(); //go back to drop page without setting referring page
                return;
            }
            this.CLEAR_CACHED_MASTER_KEY();
            this.goToLoginPage(referringPage);
        }.bind(this);
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
        a.download = this.DOWNLOAD_FILE_NAME;
        a.click();
          
        URL.revokeObjectURL(a.href);
    }

    async addPassEntry(input, referringPage) {
        this.hideAllPages();
        this.mainLoading.show();
        this.disableDraggbleMenuBackButton();

        // https://stackoverflow.com/questions/14367168/css-animations-stall-when-running-javascript-function
        try {
            await this.passManager.addPassEntry(input); //wait for web worker completion
        } catch (e) {
            if(e instanceof AppError) {
                if(e.isType(AppErrorType.MISSING_MASTER_PASSWORD)) {
                    let callBackAfterLogin = (refPage) => {
                        this.addPassEntry(input, refPage);
                    };
                    this.goToLoginPage(referringPage, callBackAfterLogin);
                    return;
                }
            }
            throw e;
        }
        this.goToMainPage(null);
    }

    async editPassEntry(entryTag, input, referringPage) {
        this.hideAllPages();
        this.mainLoading.show();
        this.disableDraggbleMenuBackButton();

        try {
            await this.passManager.editPassEntry(entryTag, input); //wait for web worker completion
        } catch (e) {
            if(e instanceof AppError) {
                if(e.isType(AppErrorType.MISSING_MASTER_PASSWORD)) {
                    let callBackAfterLogin = (refPage) => {
                        this.editPassEntry(entryTag, input, refPage);
                    };
                    this.goToLoginPage(referringPage, callBackAfterLogin);
                    return;
                }
            }
            throw e;
        }

        this.pages.EditPage.completeEditEntry();
        this.goToMainPage(null);
    }

    confirmEditPageEntry(entry, referringPage) {
        this.pages.EditPage.setReferringPage(referringPage);
        this.pages.EditPage.confirmEditEntry(entry);
    }

    deleteEntry(entry, referringPage) {
        this.passManager.deletePassEntry(entry);
        this.goToMainPage(null);
    }

    async decryptPassEntryField(field, content, referringPage, component) {
        let decryptedField;
        this.disableDraggbleMenuBackButton();

        try {
            decryptedField = await this.passManager.decryptPassEntryField(field, content); //wait for web worker completion
        } catch (e) {
            if(e instanceof AppError) {
                if(e.isType(AppErrorType.MISSING_MASTER_PASSWORD)) {
                    let callBackAfterLogin = (refPage) => {
                        component.toggleButton.getElement().click();
                        this.goToMainPage(null, false);
                    };
                    this.goToLoginPage(referringPage, callBackAfterLogin);
                    throw new AppError("Redirecting to login before decrypting", AppErrorType.MISSING_MASTER_PASSWORD);
                }
            }
            throw e;
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

    async generateMasterKey(referringPage) {
        this.disableDraggbleMenuBackButton();

        try {
            await this.passManager.generateMasterKey();
        } catch (e) {
            if(e instanceof AppError) {
                if(e.isType(AppErrorType.MISSING_MASTER_PASSWORD)) {
                    let callBackAfterLogin = async (refPage) => {
                        await this.generateMasterKey(refPage);
                        this.goToMainPage(null, false);
                    };
                    this.goToLoginPage(referringPage, callBackAfterLogin);
                    return;
                }
            }
        }
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

    goToLoginPage(referringPage, callBackAfterLogin) {
        this.pages.LoginPage.setReferringPage(referringPage);
        this.pages.LoginPage.setCallBackAfterLogin(callBackAfterLogin);
        this.pages.LoginPage.show();
    }

    transitionFromIntro() {
        setTimeout(function() {
            this.mainPanel.getElement().style.maxWidth = "2000px";
            this.mainPanel.getElement().style.maxHeight = "2000px";
        }.bind(this), 500);
    }
}