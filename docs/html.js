const HtmlTypes = {
    CLASS: "CLASS",
    ID: "ID",
    ERROR: "ERROR",
};

class Element {
    constructor(type, label) {
        this.type = this.getType(type);
        this.label = label;

        this.HIDE_CLASS = "hide";
    }

    getType(type) {
        if(type === "class") {
            return HtmlTypes.CLASS;
        } else if(type === "id") {
            return HtmlTypes.ID;
        } else {
            return HtmlTypes.ERROR;
        }
    }

    getElement() {
        if(this.type === HtmlTypes.CLASS) {
            return document.getElementsByClassName(this.label);
        } else if(this.type === HtmlTypes.ID) {
            return document.getElementById(this.label);
        } else {
            throw new Error("No element found");
        }
    }

    addEventListener(events, func) {
        if(!Array.isArray(events)) throw new Error("events should be an Array");

        events.forEach(e => {
            this.getElement().addEventListener(e, func);
        })
    }

    hide() {
        this.getElement().classList.add(this.HIDE_CLASS);
    }

    show() {
        this.getElement().classList.remove(this.HIDE_CLASS);
    }
}

class Page { 
    constructor(elementId, app) {
        this.page = new Element("id", elementId);
        this.app = app;
        this.appPages = null;
    }

    setAppPages(pages) {
        this.appPages = pages;
    }

    show() {
        this.app.hideAllPages();
        this.page.show();
    }

    hide() {
        this.page.hide();
    }

    setup() {}
}

class MainPage extends Page {
    constructor(app) {
        super("main-page", app);
        this.created = false;

        this.mainContent = new Element("id", "main-content");
        // this.mainTable = new Element("id", "main-table");
        
        this.MAIN_TABLE_ID = "main-table";
        this.MAIN_ENTRY_ID_PREFIX = "main-entry-";

        this.ENTRY_TABLE_CLASSES = "v hv-l vh-c entry-table".split(" ");
        this.ENTRY_ROW_CLASSES = "h hv-c vh-c entry-row".split(" ");
        this.ENTRY_COL_CLASS = "entry-col";
        this.DIVIDER_CLASS = "divider";
        this.HEADER_DIVIDER_CLASS = "header-divider";

        this.headers = Object.keys(new PassEntry().enumerateFields());

        this.HEADER_ROW_CLASS = "header-row";
    }

    setup() {
        let mainContent = this.mainContent.getElement();
        
        mainContent.style.width = is_mobile_or_tablet_view() ? "60vw" : "800px";
        mainContent.style.maxHeight = is_mobile_or_tablet_view() ? "60vh" : "600px";

    }

    show() {
        if(!this.created) this.create();
        super.show();
    }

    create() {
        let entries = this.app.getPassManagerEntries();
        // let testEntryStrings = ['Fb[|]website[|][|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', 'Google[|]website[|][|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', 'What[|]website[|][|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here'];
        // let entries = this.app.passManager.entriesFromStrings(testEntryStrings);

        this.createTable(entries);

        this.created = true;
    }

    createTable(entries) {
        let mainTableElement = document.createElement("div");
        mainTableElement.id = this.MAIN_TABLE_ID;
        this.ENTRY_TABLE_CLASSES.forEach(c => mainTableElement.classList.add(c));

        // Create header row
        let headerRowElement = document.createElement("div");
        headerRowElement.id = this.MAIN_ENTRY_ID_PREFIX + this.HEADER_ROW_CLASS; //main-entry-header-row
        this.ENTRY_ROW_CLASSES.forEach(c => headerRowElement.classList.add(c));
        headerRowElement.classList.add(this.HEADER_ROW_CLASS);

        // Populate header row with headers
        this.headers.forEach(header => {
            let headerColElement = document.createElement("div");
            headerColElement.id = this.MAIN_ENTRY_ID_PREFIX + "header-col-" + header; //Eg.main-entry-header-col-tag
            headerColElement.classList.add(this.ENTRY_COL_CLASS);
            headerColElement.innerHTML = header;
            headerRowElement.appendChild(headerColElement);
        })

        mainTableElement.appendChild(headerRowElement);

        // Create header divider
        let headerDividerElement = document.createElement("div");
        headerDividerElement.classList.add(this.DIVIDER_CLASS, this.HEADER_DIVIDER_CLASS);
        mainTableElement.appendChild(headerDividerElement);

        // Create entry rows
        entries.forEach((entry, index) => {
            if(index > 0) {
                // Create header divider
                let dividerElement = document.createElement("div");
                dividerElement.classList.add(this.DIVIDER_CLASS);
                mainTableElement.appendChild(dividerElement);
            }

            let entryRowElement = document.createElement("div");
            entryRowElement.id = this.MAIN_ENTRY_ID_PREFIX + entry.getTag();
            this.ENTRY_ROW_CLASSES.forEach(c => entryRowElement.classList.add(c));

            // Populate entry rows with entry fields
            Object.entries(entry.enumerateFields()).forEach(field => {
                let entryColElement = document.createElement("div");
                entryColElement.id = entry.getTag() + "-" + field[1]; //Eg. Google-Tag
                entryColElement.classList.add(this.ENTRY_COL_CLASS);
                entryColElement.innerHTML = field[1];
                entryRowElement.appendChild(entryColElement);
            })

            mainTableElement.appendChild(entryRowElement);  
        })

        this.mainContent.getElement().appendChild(mainTableElement);  
    }
}

class LoginPage extends Page {
    constructor(app) {
        super("login-page", app);

        this.inputUsername = new Element("id", "input-user");
        this.inputPassword = new Element("id", "input-password");
        this.submitUserPasswordButton = new Element("id", "submit-user-password");
    }

    setup() {
        this.inputPassword.addEventListener(["input"],
            function() {
                if(this.inputPassword.getElement().value) {
                    this.submitUserPasswordButton.show();
                }else{
                    this.submitUserPasswordButton.hide();
                }
            }.bind(this));
        
        this.submitUserPasswordButton.addEventListener(["click"],
            function() {
                let pw = this.inputPassword.getElement().value;
                this.inputPassword.getElement().value = "";

                this._savePasswordToApp(pw);
            }.bind(this));
    }

    show() {
        super.show();
        this.submitUserPasswordButton.hide();
    }

    _savePasswordToApp(p) {
        this.app.savePasswordToPassManager(p);
    }
}

class DropPage extends Page {
    constructor(app) {
        super("drop-page", app);

        this.inputPasswordFile = new Element("id", "input-password-file");
        this.dropPanel = new Element("id", "drop-panel");
        this.dropZone = new Element("id", "drop-zone");
        
        this.confirmPassFileContent = new Element("id", "confirm-password-file-content");
        this.passFileTitle = new Element("id", "password-file-title");
        this.confirmPasswordFileButtons = new Element("id","confirm-password-file-buttons");
        this.confirmPasswordFileErrorButton = new Element("id","confirm-password-file-error-button");
        this.cancelPassFileButton = new Element("id", "cancel-password-file-button");
        this.confirmPassFileButton = new Element("id", "confirm-password-file-button"); 

        this.DROP_ZONE_ACTIVE_CLASS = "drop-panel-active"; 
        this.DROP_ZONE_HOVER_CLASS = "drop-panel-hover"; 
    }

    setup() {
        this.dropZone.addEventListener(["drop"], function(event) {
            this._setDropPanelClass(true);
            this._dropZoneDropHandler(event);
        }.bind(this));

        this.dropZone.addEventListener(["dragenter"], function(event) {
            this._setDropPanelClass(false, true);
            this._dropZoneDragOverHandler(event);
        }.bind(this));
                    
        this.inputPasswordFile.addEventListener(["change"], function(event) {
            let files = event.target.files;

            if (!files.length || files.length > 1) { //only 1 file allowed
                return;
            }

            this.app.setRawPassFile(files[0]);
            this.inputPasswordFile.getElement().value = ""; //clear stored file after uploading
            this._confirmRawPassFile();
        }.bind(this));

        this.inputPasswordFile.addEventListener(["mousedown", "focus", "focusin"], function() {
            this._setDropPanelClass(true);
        }.bind(this));

        this.inputPasswordFile.addEventListener(["mouseover", "mousein"], function() {
            this._setDropPanelClass(false, true);
        }.bind(this));

        this.inputPasswordFile.addEventListener(["mouseup", "mouseout", "focusout", "dragleave"], function() {
            this._setDropPanelClass(false);
        }.bind(this));

        this.cancelPassFileButton.addEventListener(["click"], function() {
            this._appDeleteRawPassFile();
            this.show();
        }.bind(this));

        this.confirmPasswordFileErrorButton.addEventListener(["click"], function() {
            this._appDeleteRawPassFile();
            this.show();
        }.bind(this));

        this.confirmPassFileButton.addEventListener(["click"], function() {
            this._appExtractRawPassFile();
        }.bind(this));
    }

    show(fileDrop = true) {
        super.show();

        this._setPassFileTitle();
        if(fileDrop) {
            this.dropZone.show();
            this.confirmPassFileContent.hide();
        } else { //confirm password file subpage
            this.dropZone.hide();
            this.confirmPassFileContent.show();
        }
        this._fileDropPasswordFileButtons();
    }

    _fileDropPasswordFileButtons(error = false) {
        if(error) {
            this.confirmPasswordFileButtons.hide();
            this.confirmPasswordFileErrorButton.show();
        } else {
            this.confirmPasswordFileButtons.show();
            this.confirmPasswordFileErrorButton.hide();
        }
    }

    _setDropPanelClass(active, hover = false) {
        let dropPanel = this.dropPanel.getElement();
        
        if(active) {
            dropPanel.classList.add(this.DROP_ZONE_ACTIVE_CLASS);
        } else {
            dropPanel.classList.remove(this.DROP_ZONE_ACTIVE_CLASS);
        }

        if(hover) {
            dropPanel.classList.add(this.DROP_ZONE_HOVER_CLASS);
        } else {
            dropPanel.classList.remove(this.DROP_ZONE_HOVER_CLASS);
        }
    }

    _dropZoneDropHandler(event) {
        event.preventDefault();

        if (event.dataTransfer.items) {
            if (!event.dataTransfer.items.length || event.dataTransfer.items.length > 1) { //only 1 file allowed
                return;
            }

            if (event.dataTransfer.items[0].kind === "file") {
                this.app.setRawPassFile(event.dataTransfer.items[0].getAsFile());
                this._confirmRawPassFile();
            }
        } else {
            if (!event.dataTransfer.files.length || event.dataTransfer.files.length > 1) { //only 1 file allowed
                return;
            }

            this.app.setRawPassFile(event.dataTransfer.files[0]);
            this._confirmRawPassFile();
        }
    }

    _dropZoneDragOverHandler(event) {
        event.preventDefault();
    }

    _confirmRawPassFile() {
        this.show(false);

        let rawPassFile = this.app.getRawPassFile();

        if(!rawPassFile) {
            this._rawPassFileError("Error uploading file. Try again.");
            return;
        }

        if(!rawPassFile.name.endsWith(".txt")) {
            this._rawPassFileError("File must be a .txt file");
            return;
        }

        this._setPassFileTitle(rawPassFile.name);
    }

    _rawPassFileError(errorMessage) {
        this._fileDropPasswordFileButtons(true);
        this._appDeleteRawPassFile();
        this._setPassFileTitle(errorMessage);
    }

    _setPassFileTitle(title = "") {
        this.passFileTitle.getElement().innerHTML = title;
    }

    _appDeleteRawPassFile() {
        this.app.setRawPassFile(null);
    }

    _appExtractRawPassFile() {
        this.app.extractRawPassFile();
    }
}

class App {
    //upload file
    //login or skip 
    //see entries - with key (if logged in) – or option to login
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
        let mainPanel = this.mainPanel.getElement();
        
        // mainPanel.style.maxWidth = is_mobile_or_tablet_view() ? "80vw" : "800px";
        // mainPanel.style.maxHeight = is_mobile_or_tablet_view() ? "60vw" : "600px";

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