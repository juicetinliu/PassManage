class App {
    constructor() {
        this.passManager = new PassManager(this);

        this.appToken = "password";

        this.main = new Element("id", "main");
        this.mainPanel = new Element("id", "main-panel");
        this.mainLoading = new Element("id", "main-panel-loading");

        this.pages = {
            DropPage: new DropPage(this), 
            LoginPage: new LoginPage(this), 
            MainPage: new MainPage(this),
            EditPage: new EditPage(this),
            IntroPage: new IntroPage(this)
        };

        Object.values(this.pages).forEach(p => p.setAppPages(this.pages));

        this.rawPassFile = null;
        this.passFile = null;

        this.DOWNLOAD_FILE_NAME = "pass.txt"
        
        // URL Regex https://regexr.com/3e6m0
        this.WEBSITE_REGEXP = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
    }

    run() {
        this.setup();
        this.transitionFromIntro();
        this.main.show();
    }

    setup(){
        Object.values(this.pages).forEach(p => p.setup());
        this.mainLoading.hide();

        this.pages.IntroPage.show();
        // this.pages.DropPage.show();
        // this.pages.LoginPage.show();
        // this.pages.MainPage.show();
        // this.pages.EditPage.show();
        // this.___DEBUG_MAIN_PAGE();
    }

    ___DEBUG_MAIN_PAGE() {
        // FOR DEBUGGING
        let testEntryStrings = ['Fb[|]website[|]user[|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', 'Google[|]website.com[|][|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', 'What[|]website[|][|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', ];
        let e = this.passManager.entriesFromStrings(testEntryStrings);
        this.passManager.setEntries(e);

        this.goToMainPage(null);
    }

    getPassManagerEntries() {
        return this.passManager.getEntries();
    }

    hideAllPages() {
        Object.values(this.pages).forEach(p => p.hide());
        this.mainLoading.hide();
        // this.mainPanel.getElement().style.maxWidth = "100px";
    }

    savePasswordToPassManager(pw, referringPage, callBack) {
        this.hideAllPages();
        this.mainLoading.show();

        this.passManager.saveMasterPasswordToHash(pw);

        if(callBack) { //callback after saving password 
            callBack(referringPage);
        } else {
            this.goToMainPage(referringPage);
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
                    this.goToDropPage(referringPage); //go back to drop page;
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
                this.goToDropPage(referringPage); //go back to drop page;
                return;
            }

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

        let a = document.createElement('a');
        let file = new Blob([downloadPassFile.getRaw()], {type: 'text/plain'});
            
        a.href = URL.createObjectURL(file);
        a.download = this.DOWNLOAD_FILE_NAME;
        a.click();
          
        URL.revokeObjectURL(a.href);
    }

    async addPassEntry(input, referringPage) {
        this.hideAllPages();
        this.mainLoading.show();

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
        this.goToMainPage(referringPage);
    }

    async editPassEntry(entryTag, input, referringPage) {
        this.hideAllPages();
        this.mainLoading.show();

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
        this.goToMainPage(referringPage);
    }

    confirmEditPageEntry(entry, referringPage) {
        this.pages.EditPage.setReferringPage(referringPage);
        this.pages.EditPage.confirmEditEntry(entry);
    }

    async decryptPassEntryPassword(p, referringPage, component) {
        let decryptedPassword;
        try {
            decryptedPassword = await this.passManager.decryptPassEntryField("password", p); //wait for web worker completion
        } catch (e) {
            if(e instanceof AppError) {
                if(e.isType(AppErrorType.MISSING_MASTER_PASSWORD)) {
                    let callBackAfterLogin = async (refPage) => {
                        component.toggleButton.getElement().click();
                        this.goToMainPage(refPage, false);
                    };
                    this.goToLoginPage(referringPage, callBackAfterLogin);
                    throw new AppError("Redirecting to login before decrypting", AppErrorType.MISSING_MASTER_PASSWORD);
                }
            }
            throw e;
        }
        return decryptedPassword;
    }

    async decryptPassEntrySecrets(s, referringPage) {
        let decryptedSecrets;
        try {
            decryptedSecrets = await this.passManager.decryptPassEntryField("secrets", s); //wait for web worker completion
        } catch (e) {
            if(e instanceof AppError) {
                if(e.isType(AppErrorType.MISSING_MASTER_PASSWORD)) {
                    let callBackAfterLogin = async (refPage) => {
                        await this.decryptPassEntrySecrets(p, refPage);
                    };
                    this.goToLoginPage(referringPage, callBackAfterLogin);
                    return;
                }
            }
            throw e;
        }
        return decryptedSecrets;
    }

    goToEditPage(action, referringPage, editEntry = null) {
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