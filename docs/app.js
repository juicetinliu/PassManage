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

        this.PROCESS_DELAY_MS = 1000; //for tests
        this.DOWNLOAD_FILE_NAME = "pass.txt"
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
        setTimeout(function() {
            this.passManager.saveMasterPasswordToHash(pw);

            if(callBack) { //callback after saving password 
                callBack(referringPage);
            } else {
                this.goToMainPage(referringPage);
            }
        }.bind(this), this.PROCESS_DELAY_MS);
    }

    extractRawPassFile(referringPage) {
        this.hideAllPages();

        if(!this.rawPassFile) throw new Error("no rawPassFile found");

        let fr = new FileReader();
        
        fr.readAsText(this.rawPassFile);
        
        fr.onload = function() {
            this.mainLoading.show();
            setTimeout(function() {
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
                    console.log("Something went wrong with parsing passFile")
                    console.log(e);
                    this.rawPassFile = null;
                    this.goToDropPage(referringPage); //go back to drop page;
                    return;
                }

                this.goToLoginPage(referringPage);
            }.bind(this), this.PROCESS_DELAY_MS);
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
        this.pages.MainPage.updateMainTableEntries();
        this.goToMainPage(referringPage);
    }

    confirmEditPageEntry(entry) {
        this.pages.EditPage.confirmEditEntry(entry);
    }

    async decryptPassEntryPassword(p) {
        return await this.passManager.decryptPassEntryField("password", p);
    }

    async decryptPassEntrySecrets(s) {
        return await this.passManager.decryptPassEntryField("secrets", s);
    }

    goToEditPage(action, referringPage) {
        this.pages.EditPage.show();
        this.pages.EditPage.setAction(action);
        this.pages.EditPage.setReferringPage(referringPage);
    }

    goToMainPage(referringPage) {
        this.pages.MainPage.show();
        this.pages.EditPage.setReferringPage(referringPage);
    }

    goToDropPage(referringPage) {
        this.pages.DropPage.show();
        this.pages.DropPage.setReferringPage(referringPage);
    }

    goToLoginPage(referringPage, callBackAfterLogin) {
        this.pages.LoginPage.show();
        this.pages.LoginPage.setReferringPage(referringPage);
        this.pages.LoginPage.setCallBackAfterLogin(callBackAfterLogin);
    }

    transitionFromIntro() {
        setTimeout(function() {
            this.mainPanel.getElement().style.maxWidth = "2000px";
            this.mainPanel.getElement().style.maxHeight = "2000px";
        }.bind(this), 500);
    }
}