const HtmlTypes = {
    CLASS: "CLASS",
    ID: "ID",
    ERROR: "ERROR",
};

class Element {
    constructor(type, label) {
        this.type = this.getType(type);
        this.label = label;
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
}

const CurrentPage = {

}

class App {
    //first login 
    //then upload file
    constructor() {
        this.p = new PassManager();

        this.mainPanel = new Element("id", "main-panel");
        
        this.inputPasswordFile = new Element("id", "input-password-file");
        this.dropZone = new Element("id", "drop-zone");

        this.inputUsername = new Element("id", "input-user");
        this.inputPassword = new Element("id", "input-password");
        this.submitUserPasswordButton = new Element("id", "submit-user-password");

        this.TEXT_INPUT_ERROR_CLASS = "text-input-error";
        this.DROP_ZONE_ACTIVE_CLASS = "drop-zone-active"; 
        this.DROP_ZONE_HOVER_CLASS = "drop-zone-hover"; 

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
                this._setDropZoneClass(true);
                this._dropZoneDropHandler(event);
            }.bind(this));

        this.dropZone.addEventListener(['dragenter'], 
            function(event) {
                console.log("DRAGGING");
                this._setDropZoneClass(false, true);
                this._dropZoneDragOverHandler(event);
            }.bind(this));
                    
        this.inputPasswordFile.addEventListener(['change'], 
            function(event) {
                let files = event.target.files;
                if (files.length !== 1) throw new Error("Only one file is required");
            
                this.rawPassFile = files[0];
            }.bind(this));

        this.inputPasswordFile.addEventListener(['mousedown', 'focus', 'focusin'], 
            function() {
                this._setDropZoneClass(true);
            }.bind(this));

        this.inputPasswordFile.addEventListener(['mouseup', 'mouseout', 'focusout', 'dragleave'], 
            function() {
                this._setDropZoneClass(false);
            }.bind(this));

        
        this.submitUserPasswordButton.addEventListener(['click'],
            function() {
                let pw = this.inputPassword.getElement().value;

                this.p.saveMasterPasswordToHash(pw);
                this.inputPassword.getElement().value = "";

                // if(this.passFile.decryptFile(pw)) {
                //     this.p.saveDeviceSecretToHash(this.passFile.getFirst());
                //     this.p.setEntries(this.p.entriesFromStrings(this.passFile.getEntries()));
                // }else{
                //     console.log("wrong username");
                // }
            }.bind(this));
    }

    fileDropPage() {
    }

    loginPage() {
    }

    mainPage() {
    }

    _sendPassFileToPassManager() {
        if(!this.rawPassFile) throw new Error("no rawPassFile found");

        let fr = new FileReader();
        
        fr.readAsText(this.rawPassFile);
        
        fr.onload = function() {
            this.passFile = new PassFile(fr.result);
            this.p.saveDeviceSecretToHash(this.passFile.getFirst());
            this.p.setEntries(this.p.entriesFromStrings(this.passFile.getEntries()));
        }.bind(this);
    }

    _setDropZoneClass(active, hover = false) {
        let dropZone = this.dropZone.getElement();
        
        if(active) {
            dropZone.classList.add(this.DROP_ZONE_ACTIVE_CLASS);
        } else {
            dropZone.classList.remove(this.DROP_ZONE_ACTIVE_CLASS);
        }

        if(hover) {
            dropZone.classList.add(this.DROP_ZONE_HOVER_CLASS);
        } else {
            dropZone.classList.remove(this.DROP_ZONE_HOVER_CLASS);
        }
    }

    _dropZoneDropHandler(event) {
        event.preventDefault();

        if (event.dataTransfer.items) {
            if (event.dataTransfer.items.length !== 1) throw new Error("Only one file is required");

            if (event.dataTransfer.items[0].kind === 'file') {
                this.rawPassFile = event.dataTransfer.items[0].getAsFile();
            }
        } else {
            if (event.dataTransfer.files.length !== 1) throw new Error("Only one file is required");

            this.rawPassFile = event.dataTransfer.files[0];
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