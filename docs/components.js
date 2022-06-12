const HtmlTypes = {
    CLASS: "CLASS",
    ID: "ID"
};

class Element { //exists in HTML
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
            throw new Error("Invalid element type");
        }
    }

    getElement() {
        if(this.type === HtmlTypes.CLASS) {
            return document.getElementsByClassName(this.label);
        } else if(this.type === HtmlTypes.ID) {
            return document.getElementById(this.label);
        }
        throw new Error("Shouldn't reach this in getElement()");
    }

    addEventListener(events, func) {
        let elementExists = this.exists();
        if(elementExists) {
            if(!Array.isArray(events)) throw new Error("events should be an Array");

            events.forEach(e => {
                if(this.type === HtmlTypes.CLASS) {
                    elementExists.forEach(el => {
                        el.addEventListener(e, func);
                    });
                } else if(this.type === HtmlTypes.ID) {
                    elementExists.addEventListener(e, func);
                }
            })
        } else {
            this.throwNotFoundError();
        }
    }

    hide() {
        let elementExists = this.exists();
        if(elementExists) {
            if(this.type === HtmlTypes.CLASS) {
                elementExists.forEach(el => {
                    el.classList.add(this.HIDE_CLASS);
                });
            } else if(this.type === HtmlTypes.ID) {
                elementExists.classList.add(this.HIDE_CLASS);
            }
        } else {
            this.throwNotFoundError();
        }
    }

    delete() {
        let elementExists = this.exists();
        if(elementExists) {
            if(this.type === HtmlTypes.CLASS) {
                elementExists.forEach(el => {
                    el.remove();
                });
            } else if(this.type === HtmlTypes.ID) {
                elementExists.remove();
            }
        } else {
            this.throwNotFoundError();
        }
    }

    removeChildren() {
        let elementExists = this.exists();
        if(elementExists) {
            if(this.type === HtmlTypes.CLASS) {
                throw new Error("removeChildren not compatible with class element " + this.label);
            }
            while (elementExists.firstChild) {
                elementExists.removeChild(elementExists.firstChild);
            }
        } else {
            this.throwNotFoundError();
        }
    }

    appendChild(child) {
        let elementExists = this.exists();
        if(elementExists) {
            if(this.type === HtmlTypes.CLASS) {
                throw new Error("removeChildren not compatible with class element " + this.label);
            }
            elementExists.appendChild(child);
        } else {
            this.throwNotFoundError();
        }
    }

    show() {
        let elementExists = this.exists();
        if(elementExists) {
            if(this.type === HtmlTypes.CLASS) {
                elementExists.forEach(el => {
                    el.classList.remove(this.HIDE_CLASS);
                });
            } else if(this.type === HtmlTypes.ID) {
                elementExists.classList.remove(this.HIDE_CLASS);
            }
        } else {
            this.throwNotFoundError();
        }
    }

    exists() { //return element if it exists otherwise false
        let element = this.getElement();
        if(element) {
            return element;
        } else {
            return false;
        }
    }

    throwNotFoundError() { 
        throw new Error("Element " + this.label + " not found")
    }
}

class Component extends Element{ //reusable & created elements
    constructor(type, label, app) {
        super(type, label);
        this.app = app;
        this.created = false;
    }

    create() {
        this.created = true;
    }

    setup() {
    } //any event listeners
}

class MainOptionsBar extends Component {
    constructor(app) {
        super("id", "main-page-options", app);
    }
}

class MainRowDivider extends Component {
    constructor(app) {
        super("class", "divider", app);
    }

    create() {
        let element = document.createElement("div");
        element.classList.add(this.label);
        return element;
    }
}

class MainHeaderRowDivider extends Component {
    constructor(app) {
        super("class", "header-divider", app);

        this.DIVIDER_CLASS = "divider";
    }

    create() {
        let element = document.createElement("div");
        element.classList.add(this.label, this.DIVIDER_CLASS);
        return element;
    }
}

class MainPassEntryRow extends Component {
    constructor(app, entry) {
        super("id", "main-entry-" + entry.getTag(), app);
        this.tag = entry.getTag()
        this.entry = Object.entries(entry.export(true))

        this.ENTRY_ROW_CLASSES = "h hv-c vh-c entry-row".split(" ");
        this.ENTRY_COL_CLASS = "entry-col";
    }

    create() {
        let element = document.createElement("div");
        element.id = this.label;
        this.ENTRY_ROW_CLASSES.forEach(c => element.classList.add(c));

        // Populate entry rows with entry fields
        this.entry.forEach(field => {
            let entryColElement = document.createElement("div");
            entryColElement.id = this.tag + "-" + field[0]; //Eg. Google-Tag
            entryColElement.classList.add(this.ENTRY_COL_CLASS);
            entryColElement.innerHTML = field[1];
            element.appendChild(entryColElement);
        })
        return element;
    }
}

class MainHeaderRow extends Component {
    constructor(app) {
        super("id", "main-entry-header-row", app);
        this.tableHeaders = Object.keys(new PassEntry().export(true));

        this.HEADER_ROW_CLASS = "header-row";
        this.ENTRY_ROW_CLASSES = "h hv-c vh-c entry-row".split(" ");
        this.ENTRY_COL_CLASS = "entry-col";
    }

    create() {
        // Create header row
        let element = document.createElement("div");
        element.id = this.label; //main-entry-header-row
        this.ENTRY_ROW_CLASSES.forEach(c => element.classList.add(c));
        element.classList.add(this.HEADER_ROW_CLASS);

        // Populate header row with headers
        this.tableHeaders.forEach(header => {
            let headerColElement = document.createElement("div");
            headerColElement.id = "header-col-" + header; //Eg.header-col-Password
            headerColElement.classList.add(this.ENTRY_COL_CLASS);
            headerColElement.innerHTML = capitalize(header);
            element.appendChild(headerColElement);
        })
        return element;
    }
}

class Button extends Component {
    constructor(app) {
        super("class", "butt", app);
    }

    create() {
        let element = document.createElement("button");
        element.classList.add(this.label);
        return element;
    }
}

class MaterialIcon extends Component {
    constructor(app, iconName) {
        super("class", "material-symbols-rounded", app);
        this.iconName = iconName;
    }

    create() {
        let element = document.createElement("span");
        element.classList.add(this.label);
        element.innerHTML = this.iconName;
        return element;
    }
}

class IconButton extends Component {
    constructor(app, id, iconName) {
        super("id", id, app);
        this.MAIN_BUTTON_CLASS = "butt-main";
        this.iconName = iconName;
    }

    create() {
        let element = new Button(this.app).create();
        element.id = this.label;
        element.classList.add(this.MAIN_BUTTON_CLASS);

        let icon = new MaterialIcon(this.app, this.iconName).create();
        element.appendChild(icon);
        return element;
    }

    setIconName(iconName) {
        this.iconName = iconName;
    }
}

class AddPassEntryButton extends IconButton {
    constructor(app) {
        super(app, "add-new-pass-entry-button", "playlist_add");
    }
}

class MainTable extends Component {
    constructor(app) {
        super("id", "main-table", app);

        this.headerRow = new MainHeaderRow(app);
        this.headerRowDivider = new MainHeaderRowDivider(app);
        this.dividers = new MainRowDivider(app);
        this.addPassEntryButton = new AddPassEntryButton(app);
        this.passEntryRows = [];

        this.ENTRY_TABLE_CLASSES = "v hv-l vh-c entry-table".split(" ");

        this.MAIN_TABLE_HEADER_CONTENT_ID = "main-table-header-content";
        this.MAIN_TABLE_ENTRY_CONTENT_ID = "main-table-entry-content";
        this.MAIN_TABLE_FOOTER_CONTENT_ID = "main-table-footer-content";
        this.TABLE_CONTENT_CLASSES = "v hv-l vh-c entry-table-content".split(" ");

        this.NO_ENTRIES_MESSAGE = "No entries to show";
        this.NO_ENTRIES_ADD_ICON_NAME = "add";
    }

    updateEntries(entries = []) {
        if(!this.created) {
            this.create(entries);
        } else {
            this.addPassEntryButton.delete();
            this.addPassEntryButton = new AddPassEntryButton(this.app);

            let entryContent = new Element("id", this.MAIN_TABLE_ENTRY_CONTENT_ID);
            entryContent.removeChildren();

            this.setPassEntryRows(entries);
            if(this.passEntryRows.length > 0){
                this.passEntryRows.forEach(row => {
                    let passEntryRow = row.create();
                    entryContent.appendChild(passEntryRow);
                    entryContent.appendChild(this.dividers.create());
                })
            } else {
                this.addPassEntryButton.setIconName(this.NO_ENTRIES_ADD_ICON_NAME);
                entryContent.getElement().innerHTML = this.NO_ENTRIES_MESSAGE;
            }
    
            let footerContent = new Element("id", this.MAIN_TABLE_FOOTER_CONTENT_ID);
            footerContent.appendChild(this.addPassEntryButton.create());
        }
        
        this.setupAddPassEntryButton();
    }

    create(entries = []) {
        this.setPassEntryRows(entries);

        let element = document.createElement("div");
        element.id = this.label;
        this.ENTRY_TABLE_CLASSES.forEach(c => element.classList.add(c));
        element.style.maxHeight = is_mobile_or_tablet_view() ? "60vh" : "600px";

        let headerContent = document.createElement("div");
        headerContent.id = this.MAIN_TABLE_HEADER_CONTENT_ID;
        this.TABLE_CONTENT_CLASSES.forEach(c => headerContent.classList.add(c));

        let headerRow = this.headerRow.create();
        let headerRowDivider = this.headerRowDivider.create();

        headerContent.appendChild(headerRow);
        headerContent.appendChild(headerRowDivider);

        let entryContent = document.createElement("div");
        entryContent.id = this.MAIN_TABLE_ENTRY_CONTENT_ID;
        this.TABLE_CONTENT_CLASSES.forEach(c => entryContent.classList.add(c));

        if(this.passEntryRows.length > 0){
            this.passEntryRows.forEach(row => {
                let passEntryRow = row.create();
                entryContent.appendChild(passEntryRow);
                entryContent.appendChild(this.dividers.create());
            })
        } else {
            this.addPassEntryButton.setIconName(this.NO_ENTRIES_ADD_ICON_NAME);
            entryContent.innerHTML = this.NO_ENTRIES_MESSAGE;
        }

        let footerContent = document.createElement("div");
        footerContent.id = this.MAIN_TABLE_FOOTER_CONTENT_ID;
        this.TABLE_CONTENT_CLASSES.forEach(c => footerContent.classList.add(c));

        footerContent.appendChild(this.addPassEntryButton.create());

        element.appendChild(headerContent);
        element.appendChild(entryContent);
        element.appendChild(footerContent);

        super.create();
        return element;
    }

    setPassEntryRows(entries) {
        this.passEntryRows = [];
        entries.forEach(e => {
            this.passEntryRows.push(new MainPassEntryRow(this.app, e));
        })
    }

    setup() {
        this.setupAddPassEntryButton();
    }

    setupAddPassEntryButton() {
        this.addPassEntryButton.addEventListener(["click"], function() {
            this.app.goToEditPage("add");
        }.bind(this));
    }
}

class MainOptionsSearch extends Component {
    constructor(app) {
        super("id", "main-page-option-search", app);
    }

    create() {
    }

    setup() {

    }
}

class MainOptionsDownload extends Component {
    constructor(app) {
        super("id", "main-page-option-download", app);
        this.button = new IconButton(app, "main-page-option-download-button", "download");
    }

    create() {
        let element = document.createElement("div");
        element.id = this.label;
        
        element.appendChild(this.button.create());

        return element;
    }

    setup() {
        this.button.addEventListener(["click"], function() {
            this.app.downloadPassFile();
        }.bind(this));
    }
}

class EditTextInput extends Component {
    constructor(app, tag) {
        super("id", "edit-text-input-" + tag, app);

        this.TEXT_INPUT_CLASS = "text-input";
        this.inputType = "text";
    }

    create() {
        let element = document.createElement("input");
        element.id = this.label;
        element.setAttribute("type", this.inputType);
        element.classList.add(this.TEXT_INPUT_CLASS);
        element.setAttribute("name", this.label);

        return element;
    }

    setInputType(type) {
        this.inputType = type;
    }
}


class EditTextArea extends Component {
    constructor(app, tag) {
        super("id", "edit-text-area-" + tag, app);

        this.TEXT_AREA_CLASS = "text-area";
    }

    create() {
        let element = document.createElement("textarea");
        element.id = this.label;
        element.classList.add(this.TEXT_AREA_CLASS);
        element.setAttribute("name", this.label);

        return element;
    }
}

class EditView extends Component {
    constructor(app) {
        super("id", "edit-view", app);
        this.passEntryDefaults = Object.entries(new PassEntry().export(false));

        this.inputs = {}
        this.passEntryDefaults.forEach(field => {
            if(Array.isArray(field[1])) {
                this.inputs[field[0]] = new EditTextArea(app, field[0]);
            } else {
                this.inputs[field[0]] = new EditTextInput(app, field[0]);
            }
        })
        this.inputs.password.setInputType("password");

        this.confirmButton = new IconButton(app, "edit-view-confirm-button", "check_circle");

        this.cancelButton = new IconButton(app, "edit-view-cancel-button", "cancel");

        this.EDIT_VIEW_CLASSES = "v hv-c vh-c".split(" ");
        this.EDIT_VIEW_HOLDER_CLASSES = "h hv-c vh-c".split(" ");
    }

    create() {
        let element = document.createElement("div");
        element.id = this.label;
        this.EDIT_VIEW_CLASSES.forEach(c => element.classList.add(c));

        Object.entries(this.inputs).forEach(entry => {
            let header = entry[0];
            let inputElement = entry[1];

            let holder = document.createElement("div");
            this.EDIT_VIEW_HOLDER_CLASSES.forEach(c => holder.classList.add(c));

            let headerContent = document.createElement("div");
            headerContent.innerHTML = capitalize(header);;
            
            holder.appendChild(headerContent);
            holder.appendChild(inputElement.create());

            element.appendChild(holder);
        })

        let footer = document.createElement("div");
        this.EDIT_VIEW_HOLDER_CLASSES.forEach(c => footer.classList.add(c));

        footer.appendChild(this.cancelButton.create());
        footer.appendChild(this.confirmButton.create());

        element.appendChild(footer);
        
        super.create();
        return element;
    }

    setup() {
        this.cancelButton.addEventListener(["click"], function() {
            this.app.goToMainPage();
        }.bind(this));

        this.confirmButton.addEventListener(["click"], function() {
            let entry = this.convertInputValuesToEditPageEntry();
            this.app.confirmEditPageEntry(entry);
        }.bind(this));
    }

    convertInputValuesToEditPageEntry() {
        let out = {};
        this.passEntryDefaults.forEach(field => {
            let value = this.inputs[field[0]].getElement().value;
            if(value){
                if(Array.isArray(field[1])) {
                    value = value.split("\n");
                }
                out[field[0]] = value;
            }
        })
        return out;
    }

    clearInputs() {
        Object.values(this.inputs).forEach(input => {
            input.getElement().value = "";
        });
    }
}