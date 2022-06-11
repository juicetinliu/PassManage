class App {
    constructor() {
        this.passManager = new PassManager();

        this.appToken = "password";

        this.mainPanel = new Element("id", "main-panel");

        this.pages = {
            DropPage: new DropPage(this), 
            LoginPage: new LoginPage(this), 
            MainPage: new MainPage(this)
        };

        Object.values(this.pages).forEach(p => p.setAppPages(this.pages));

        this.rawPassFile = null;
        this.passFile = null;

        this.PROCESS_DELAY_MS = 1000;
    }

    run() {
        window.addEventListener("load", function() {
            this.setup();
            this.mainPanel.show();
        }.bind(this));
    }

    setup(){

        Object.values(this.pages).forEach(p => p.setup());

        this.pages.DropPage.show();
        // this.pages.MainPage.show();
    }

    getPassManagerEntries() {
        return this.passManager.getEntries();
    }

    hideAllPages() {
        Object.values(this.pages).forEach(p => p.hide());
    }

    savePasswordToPassManager(pw) {
        this.hideAllPages();

        setTimeout(function() {
            this.passManager.saveMasterPasswordToHash(pw);

            this.pages.MainPage.show();
        }.bind(this), this.PROCESS_DELAY_MS);
    }

    extractRawPassFile() {
        this.hideAllPages();

        if(!this.rawPassFile) throw new Error("no rawPassFile found");

        let fr = new FileReader();
        
        fr.readAsText(this.rawPassFile);
        
        fr.onload = function() {
            setTimeout(function() {
                let passFile = new PassFile(fr.result);

                if(!passFile.isProcessed()) {
                    try {
                        passFile.decryptFileAndProcess(this.appToken);
                    } catch (e) {
                        console.log("Something went wrong with decrypting passFile")
                        console.log(e);
                        this.rawPassFile = null;
                        this.pages.DropPage.show(); //go back to drop page;
                        return;
                    }
                }

                this.passFile = passFile;

                this.passManager.saveDeviceSecretToHash(this.passFile.getLast());
                this.passManager.setEntries(this.passManager.entriesFromStrings(this.passFile.getEntries()));

                this.pages.LoginPage.show();
            }.bind(this), this.PROCESS_DELAY_MS);
        }.bind(this);
    }

    setRawPassFile(rawPassFile){
        this.rawPassFile = rawPassFile;
    }

    getRawPassFile() {
        return this.rawPassFile;
    }
}

//https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
//https://stackoverflow.com/questions/7060750/detect-the-enter-key-in-a-text-input-field
//https://robkendal.co.uk/blog/2020-04-17-saving-text-to-client-side-file-using-vanilla-js
// https://stackoverflow.com/questions/256754/how-to-pass-arguments-to-addeventlistener-listener-function