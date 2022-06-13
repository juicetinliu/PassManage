class Page { 
    constructor(elementId, app) {
        this.pageElement = new Element("id", elementId);
        this.app = app;
        this.appPages = null;
        this.components = {};

        this.referringPage = null; //page that resulted in this one opening

        this.created = false;
    }

    setAppPages(pages) {
        this.appPages = pages;
    }

    show() {
        if(!this.created) this.create();
        this.app.hideAllPages();
        this.pageElement.show();
    }

    hide() {
        if(!this.created) this.create();
        this.pageElement.hide();
    }

    setup() {
        if(!this.created) this.create();
        Object.values(this.components).forEach(c => c.setup());
    }

    create() {
        this.created = true;
    }

    setReferringPage(page) {
        this.referringPage = page;
    }
}

class IntroPage extends Page {
    constructor(app) {
        super("intro-page", app);
    
        this.startNewButton = new Element("id", "intro-start-new-content");
        this.fromFileButton = new Element("id", "intro-from-file-content");
    }

    setup() {
        this.startNewButton.addEventListener(["click"], function() {
            this.app.goToMainPage();
        }.bind(this));

        this.fromFileButton.addEventListener(["click"], function() {
            this.app.goToDropPage(this);
        }.bind(this));
    }

    show() {
        super.show();
    }
}

class EditPage extends Page {
    constructor(app) {
        super("edit-page", app);

        this.editContent = new Element("id", "edit-content");

        this.components = {
            editView: new EditView(app)
        }

        this.actionTypes = {
            ADD: "add",
            EDIT: "edit"
        }

        this.action = this.actionTypes.ADD; //ADD or EDIT
    }
    
    setup() {
        super.setup();
    }

    setAction(action) {
        if(action === this.actionTypes.ADD) {
            this.action = this.actionTypes.ADD;
        } else if (action === this.actionTypes.EDIT) {
            this.action = this.actionTypes.EDIT;
        } else {
            console.log("invalid action " + action + "; defaulting to ADD");
            this.action = this.actionTypes.ADD;
        }
    }

    show() {
        this.components.editView.clearInputs();
        super.show()
    }

    create() {
        super.create();
        let view = this.components.editView.create();
        this.editContent.appendChild(view);
    }

    confirmEditEntry(entry) {
        if(this.action === this.actionTypes.ADD) {
            this.app.addPassEntry(entry, this);
        } else if (this.action === this.actionTypes.EDIT) {
            // this.app.editPassEntry(entry);
        } else {
            throw new Error("Shouldn't reach this in confirmEntry()")
        }
    }
}

class MainPage extends Page {
    constructor(app) {
        super("main-page", app);

        this.mainContent = new Element("id", "main-content");

        this.components = {
            mainOptionsBar: new MainOptionsBar(app),
            mainSearchOption: new MainOptionsSearch(app),
            mainDownloadButton: new MainOptionsDownload(app),
            // include edit button
            mainTable: new MainTable(app)
        }
    }

    setup() {
        super.setup();
        let mainContent = this.mainContent.getElement();
        
        mainContent.style.width = is_mobile_or_tablet_view() ? "60vw" : "800px";
    }

    show() {
        super.show();
        this.updateMainTableEntries();
        this.components.mainOptionsBar.show();
    }

    hide() {
        this.components.mainOptionsBar.hide();
        super.hide();
    }

    create() {
        super.create();
        // let testEntryStrings = ['Fb[|]website[|]user[|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', 'Google[|]website[|][|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', 'What[|]website[|][|]something[|]hehe[|]pass[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here', ];
        // let e = this.app.passManager.entriesFromStrings(testEntryStrings);
        // this.app.passManager.setEntries(e);

        let entries = this.app.getPassManagerEntries();

        this.createMainTable(entries);
    }

    createMainTable(entries) {
        let table = this.components.mainTable.create(entries);

        this.mainContent.appendChild(table);
    }

    updateMainTableEntries() {
        let entries = this.app.getPassManagerEntries();
        this.components.mainTable.updateEntries(entries);
    }
}

class LoginPage extends Page {
    constructor(app) {
        super("login-page", app);

        this.inputUsername = new Element("id", "input-user");
        this.inputPassword = new Element("id", "input-password");
        this.submitUserPasswordButton = new Element("id", "submit-user-password");
        this.callBackAfterLogin = null;
    }

    setCallBackAfterLogin(callBack) {
        this.callBackAfterLogin = callBack;
    }

    setup() {
        this.inputPassword.addEventListener(["input"], function() {
            if(this.inputPassword.getElement().value) {
                this.submitUserPasswordButton.show();
            }else{
                this.submitUserPasswordButton.hide();
            }
        }.bind(this));
        
        this.submitUserPasswordButton.addEventListener(["click"], function() {
            let pw = this.inputPassword.getElement().value;
            this.validatePassword(pw);
            this.inputPassword.getElement().value = "";

            this._savePasswordToApp(pw);
        }.bind(this));

        // https://stackoverflow.com/questions/7060750/detect-the-enter-key-in-a-text-input-field
        this.inputPassword.addEventListener(["keyup"], function(event) {
            if(event.key === 'Enter' || event.keyCode === 13){
                this.submitUserPasswordButton.getElement().click();
            }
        }.bind(this));
    }

    show() {
        super.show();
        this.submitUserPasswordButton.hide();
    }

    _savePasswordToApp(p) {
        this.app.savePasswordToPassManager(p, this, this.callBackAfterLogin);
    }

    validatePassword(password) {
        if(!password) throw new AppError("Password must not be empty", AppErrorType.INVALID_MASTER_PASSWORD);
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
            this._appExtractRawPassFile(this);
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

    //https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
    _dropZoneDropHandler(event) {
        event.preventDefault();
        console.log(event);
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

    _appExtractRawPassFile(referringPage) {
        this.app.extractRawPassFile(referringPage);
    }
}