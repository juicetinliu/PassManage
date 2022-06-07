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
}

class App {
    constructor() {
        this.mainPanel = new Element("id", "main-panel");
        this.inputPasswordFile = new Element("id", "input-password-file");
        this.dropZone = new Element("id", "drop-zone");

        this.DROP_ZONE_ACTIVE_CLASS = "drop-zone-active"; 

        this.passFile = null;
    }

    run() {
        window.addEventListener('load', function() {
            this.onload();
        }.bind(this));
    }

    onload(){
        let mainPanel = this.mainPanel.getElement();
        
        mainPanel.style.maxWidth = is_mobile_or_tablet_view() ? '80vw' : '800px';
        mainPanel.style.maxHeight = is_mobile_or_tablet_view() ? '60vw' : '600px';

        let dropZone = this.dropZone.getElement();

        dropZone.addEventListener('drop', 
            function(event) {
                this._setDropZoneClass(true);
                this._dropZoneDropHandler(event);
            }.bind(this));

        dropZone.addEventListener('dragover', 
            function(event) {
                this._dropZoneDragOverHandler(event);
            }.bind(this));
        

        let inputPasswordFile = this.inputPasswordFile.getElement();
            
        inputPasswordFile.addEventListener('change', 
            function(event) {
                let files = event.target.files;
                if (files.length !== 1) throw new Error("Only one file is required");
            
                this.passFile = files[0];
            }.bind(this));

        inputPasswordFile.addEventListener('mousedown', 
            function() {
                this._setDropZoneClass(true);
            }.bind(this));

        inputPasswordFile.addEventListener('mouseup', 
            function() {
                this._setDropZoneClass(false)
            }.bind(this));

        inputPasswordFile.addEventListener('mouseout', 
            function() {
                this._setDropZoneClass(false)
            }.bind(this));

        inputPasswordFile.addEventListener('focus', 
            function() {
                this._setDropZoneClass(true)
            }.bind(this));

        inputPasswordFile.addEventListener('focusin', 
            function() {
                this._setDropZoneClass(true)
            }.bind(this));

        inputPasswordFile.addEventListener('focusout', 
            function() {
                this._setDropZoneClass(false)
            }.bind(this));
    }

    fileDropPage() {

    }

    loginPage() {

    }

    mainPage() {

                // var fr=new FileReader();
                // fr.onload=function(){
                //     console.log(fr.result);
                // }
                // fr.readAsText(this.files[0]);
    }

    _setDropZoneClass(active) {
        let dropZone = this.dropZone.getElement();
        
        if(active) {
            dropZone.classList.add(this.DROP_ZONE_ACTIVE_CLASS);
        }else{
            dropZone.classList.remove(this.DROP_ZONE_ACTIVE_CLASS);
        }
    }

    _dropZoneDropHandler(event) {
        console.log('File(s) dropped');

        event.preventDefault();
      
        if (event.dataTransfer.items) {
            if (event.dataTransfer.items.length !== 1) throw new Error("Only one file is required");

            if (event.dataTransfer.items[0].kind === 'file') {
                this.passFile = event.dataTransfer.items[0].getAsFile();
            }
        } else {
            if (event.dataTransfer.files.length !== 1) throw new Error("Only one file is required");

            this.passFile = event.dataTransfer.files[0];
        }
    }

    _dropZoneDragOverHandler(event) {
        console.log('File(s) in drop zone');
        event.preventDefault();
    }
}

//https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
//https://stackoverflow.com/questions/7060750/detect-the-enter-key-in-a-text-input-field
//https://robkendal.co.uk/blog/2020-04-17-saving-text-to-client-side-file-using-vanilla-js
// https://stackoverflow.com/questions/256754/how-to-pass-arguments-to-addeventlistener-listener-function
function dropHandler(ev) {
    
}

function dragOverHandler(ev) {
}