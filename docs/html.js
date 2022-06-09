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

const CurrentPage = {

}

class App {
    //upload file
    //login or skip 
    //see entries - with key (if logged in) – or option to login
    constructor() {
        this.p = new PassManager();

        this.mainPanel = new Element("id", "main-panel");
        
        this.dropPage = new Element("id", "drop-page");
        this.inputPasswordFile = new Element("id", "input-password-file");
        this.dropPanel = new Element("id", "drop-panel");
        this.dropZone = new Element("id", "drop-zone");
        
        this.confirmPassFileContent = new Element("id", "confirm-password-file-content");
        this.passFileTitle = new Element("id", "password-file-title");
        this.confirmPasswordFileButtons = new Element("id","confirm-password-file-buttons");
        this.confirmPasswordFileErrorButton = new Element("id","confirm-password-file-error-button");
        this.cancelPassFileButton = new Element("id", "cancel-password-file-button");
        this.confirmPassFileButton = new Element("id", "confirm-password-file-button"); 

        this.loginPage = new Element("id", "login-page");
        this.inputUsername = new Element("id", "input-user");
        this.inputPassword = new Element("id", "input-password");
        this.submitUserPasswordButton = new Element("id", "submit-user-password");

        this.mainPage = new Element("id", "main-page");

        this.DROP_ZONE_ACTIVE_CLASS = "drop-panel-active"; 
        this.DROP_ZONE_HOVER_CLASS = "drop-panel-hover"; 

        this.pages = [this.dropPage, this.loginPage, this.mainPage];

        this.rawPassFile = null;
        this.passFile = null;
    }

    run() {
        window.addEventListener('load', function() {
            this.setup();
        }.bind(this));
    }

    setup(){
        let mainPanel = this.mainPanel.getElement();
        
        mainPanel.style.maxWidth = is_mobile_or_tablet_view() ? '80vw' : '800px';
        mainPanel.style.maxHeight = is_mobile_or_tablet_view() ? '60vw' : '600px';

        this.dropZone.addEventListener(['drop'], 
            function(event) {
                this._setDropPanelClass(true);
                this._dropZoneDropHandler(event);
            }.bind(this));

        this.dropZone.addEventListener(['dragenter'], 
            function(event) {
                console.log("DRAGGING");
                this._setDropPanelClass(false, true);
                this._dropZoneDragOverHandler(event);
            }.bind(this));
                    
        this.inputPasswordFile.addEventListener(['change'], 
            function(event) {
                let files = event.target.files;
                if (files.length !== 1) throw new Error("Only one file is required");

                this.rawPassFile = files[0];
                this._confirmRawPassFile();
            }.bind(this));

        this.inputPasswordFile.addEventListener(['mousedown', 'focus', 'focusin'], 
            function() {
                this._setDropPanelClass(true);
            }.bind(this));

        this.inputPasswordFile.addEventListener(['mouseover', 'mousein'], 
            function() {
                this._setDropPanelClass(false, true);
            }.bind(this));

        this.inputPasswordFile.addEventListener(['mouseup', 'mouseout', 'focusout', 'dragleave'], 
            function() {
                this._setDropPanelClass(false);
            }.bind(this));

        this.inputPassword.addEventListener(['input'],
            function() {
                if(this.inputPassword.getElement().value) {
                    this.submitUserPasswordButton.show();
                }else{
                    this.submitUserPasswordButton.hide();
                }
            }.bind(this));
        
        this.submitUserPasswordButton.addEventListener(['click'],
            function() {
                let pw = this.inputPassword.getElement().value;

                this.p.saveMasterPasswordToHash(pw);
                this.inputPassword.getElement().value = "";

                this.showMainPage();
            }.bind(this));

        this.cancelPassFileButton.addEventListener(['click'], 
            function() {
                this.showFileDropPage();
            }.bind(this));

        this.confirmPasswordFileErrorButton.addEventListener(['click'],
            function() {
                this.showFileDropPage();
            }.bind(this));

        this.confirmPassFileButton.addEventListener(['click'], 
            function() {
                console.log("sending");
                this.showLoginPage();
            }.bind(this));

        this.showFileDropPage();
    }

    showFileDropPage(fileDrop = true) {
        this.pages.forEach(p => p.hide());
        this.dropPage.show();
        if(fileDrop) {
            this.rawPassFile = null;
            this.passFileTitle.getElement().innerHTML = "";

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

    showLoginPage() {
        this.pages.forEach(p => p.hide());
        this.loginPage.show();
        this.submitUserPasswordButton.hide();
    }

    showMainPage() {
        this.pages.forEach(p => p.hide());
        this.mainPage.show();
    }

    _sendPassFileToPassManager() {
        if(!this.rawPassFile) throw new Error("no rawPassFile found");

        let fr = new FileReader();
        
        fr.readAsText(this.rawPassFile);
        
        fr.onload = function() {
            this.passFile = new PassFile(fr.result);
            // this.p.saveDeviceSecretToHash(this.passFile.getFirst());
            // this.p.setEntries(this.p.entriesFromStrings(this.passFile.getEntries()));
        }.bind(this);
    }

    _confirmRawPassFile() {
        this.showFileDropPage(false);

        if(!this.rawPassFile) {
            this._rawPassFileError("Error uploading file. Try again.");
            return;
        }

        if(!this.rawPassFile.name.endsWith(".txt")) {
            this._rawPassFileError("File must be a .txt file");
            return;
        }

        this.passFileTitle.getElement().innerHTML = this.rawPassFile.name;
    }

    _rawPassFileError(errorMessage) {
        this._fileDropPasswordFileButtons(true);

        this.passFileTitle.getElement().innerHTML = errorMessage;
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
            if (event.dataTransfer.items.length !== 1) throw new Error("One file is required");

            if (event.dataTransfer.items[0].kind === 'file') {
                this.rawPassFile = event.dataTransfer.items[0].getAsFile();
                this._confirmRawPassFile();
            }
        } else {
            if (event.dataTransfer.files.length !== 1) throw new Error("One file is required");

            this.rawPassFile = event.dataTransfer.files[0];
            this._confirmRawPassFile();
        }
    }

    _dropZoneDragOverHandler(event) {
        event.preventDefault();
    }
}

//https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
//https://stackoverflow.com/questions/7060750/detect-the-enter-key-in-a-text-input-field
//https://robkendal.co.uk/blog/2020-04-17-saving-text-to-client-side-file-using-vanilla-js
// https://stackoverflow.com/questions/256754/how-to-pass-arguments-to-addeventlistener-listener-function