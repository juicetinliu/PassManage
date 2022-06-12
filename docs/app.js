class App {
    constructor() {
        this.passManager = new PassManager(this);

        this.appToken = "password";

        this.main = new Element("id", "main");

        this.pages = {
            DropPage: new DropPage(this), 
            LoginPage: new LoginPage(this), 
            MainPage: new MainPage(this),
            EditPage: new EditPage(this)
        };

        Object.values(this.pages).forEach(p => p.setAppPages(this.pages));

        this.rawPassFile = null;
        this.passFile = null;

        this.PROCESS_DELAY_MS = 1000; //for tests
        this.DOWNLOAD_FILE_NAME = "pass.txt"
    }

    run() {
        this.setup();
        this.main.show();
    }

    setup(){
        Object.values(this.pages).forEach(p => p.setup());

        this.pages.DropPage.show();
        // this.pages.LoginPage.show();
        // this.pages.MainPage.show();
        // this.pages.EditPage.show();
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

            this.goToMainPage();
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

                if(passFile.isEncrypted()) {
                    try {
                        passFile.decryptFileAndProcess(this.appToken);
                    } catch (e) {
                        console.log("Something went wrong with decrypting passFile")
                        console.log(e);
                        this.rawPassFile = null;
                        this.goToDropPage(); //go back to drop page;
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
                    this.goToDropPage(); //go back to drop page;
                    return;
                }

                this.goToLoginPage();
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
        let downloadPassFile = this.passManager.getPassFile(true);

        let a = document.createElement('a');
        let file = new Blob([downloadPassFile.getRaw()], {type: 'text/plain'});
            
        a.href = URL.createObjectURL(file);
        a.download = this.DOWNLOAD_FILE_NAME;
        a.click();
          
        URL.revokeObjectURL(a.href);
    }

    addPassEntry(input) {
        this.passManager.addPassEntry(input);

        let entries = this.getPassManagerEntries();

        this.pages.MainPage.updateMainTableEntries();

        this.goToMainPage();
    }

    confirmEditPageEntry(entry) {
        this.pages.EditPage.confirmEditEntry(entry);
    }

    goToEditPage(action) {
        this.pages.EditPage.show();
        this.pages.EditPage.setAction(action);
    }

    goToMainPage() {
        this.pages.MainPage.show();
    }

    goToDropPage() {
        this.pages.DropPage.show();
    }

    goToLoginPage() {
        this.pages.LoginPage.show();
    }
}


//https://stackoverflow.com/questions/7060750/detect-the-enter-key-in-a-text-input-field