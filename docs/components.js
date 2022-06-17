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
    constructor(type, label, page, app) {
        super(type, label);
        this.app = app;
        this.config = app.passManager.config;
        this.page = page;
        this.created = false;
    }

    create() {
        this.created = true;
    }

    setup() {
    } //any event listeners
}

class MainOptionsBar extends Component {
    constructor(app, page) {
        super("id", "main-page-options", page, app);
    }
}

class MainRowDivider extends Component {
    constructor(app, page) {
        super("class", "divider", page, app);
    }

    create() {
        let element = document.createElement("div");
        element.classList.add(this.label);
        return element;
    }
}

class MainHeaderRowDivider extends Component {
    constructor(app, page) {
        super("class", "header-divider", page, app);

        this.DIVIDER_CLASS = "divider";
    }

    create() {
        let element = document.createElement("div");
        element.classList.add(this.label, this.DIVIDER_CLASS);
        return element;
    }
}

class Button extends Component {
    constructor(app, page) {
        super("class", "butt", page, app);
    }

    create() {
        let element = document.createElement("button");
        element.classList.add(this.label);
        return element;
    }
}

class MaterialIcon extends Component {
    constructor(app, page, iconName) {
        super("class", "material-symbols-rounded", page, app);
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
    constructor(app, page, id, iconName) {
        super("id", id, page, app);
        this.MAIN_BUTTON_CLASS = "butt-main";
        this.iconName = iconName;
    }

    create() {
        let element = new Button(this.app, this.page).create();
        element.id = this.label;
        element.classList.add(this.MAIN_BUTTON_CLASS);

        let icon = new MaterialIcon(this.app, this.page, this.iconName).create();
        element.appendChild(icon);
        return element;
    }

    setIconName(iconName) {
        this.iconName = iconName;
    }
}

class EncryptedInformationToggleButton extends IconButton {
    constructor(app, page, tag, infoComponent){
        super(app, page, "encrypted-info-toggle-button-" + tag, "visibility");
        this.infoComponent = infoComponent;
        this.toggleIconName = "visibility_off";

        this.CLASS = 'encrypted-info-toggle-button';
    }

    create() {
        let element = super.create();
        element.classList.add(this.CLASS);
        
        return element;
    }
}

class SmallSquareLoader extends Component {
    constructor(app, page, id) {
        super("id", id, page, app);
        this.SMALL_SQUARE_LOADER_CLASSES = "large-square-loader small-square-loader".split(" ");
    }

    create() {
        let element = document.createElement("div");
        element.id = this.label;
        this.SMALL_SQUARE_LOADER_CLASSES.forEach(c => element.classList.add(c));

        element.appendChild(document.createElement("div"));
        element.appendChild(document.createElement("div"));
        element.appendChild(document.createElement("div"));
        element.appendChild(document.createElement("div"));
        
        return element;
    }
}

class EncryptedInformation extends Component {
    constructor(app, page, tag, passEntryField, info, encryptedPlaceholderText = "", emptyFieldText = "-"){
        super("id", "encrypted-info-component-" + passEntryField + "-" + tag, page, app);
        this.passEntryField = passEntryField;
        this.encryptedInfo = info;
        this.encryptedPlaceholderText = encryptedPlaceholderText;
        this.emptyFieldText = emptyFieldText;

        this.CONTENT_CLASSES = "h hv-l vh-c".split(" ");
        this.INFO_CONTENT_CLASS = "encrypted-info-text-content-" + passEntryField;
        this.INFO_TEXT_CLASS = "encrypted-info-text-" + passEntryField;

        if(info) {
            this.toggleButton = new EncryptedInformationToggleButton(app, page, tag, this);
        }
        
        this.encryptedInfoTextContent = new Element("id", "encrypted-info-text-content-" + passEntryField + "-" + tag);
        
        this.encryptedInfoText = new Element("id", "encrypted-info-text-" + passEntryField + "-" + tag);

        this.loader = new SmallSquareLoader(app, page, "encrypted-info-loader-" + passEntryField + "-" + tag);

        this.encrypted = true;
    }

    create() {
        let element = document.createElement("div");
        element.id = this.label;
        this.CONTENT_CLASSES.forEach(c => element.classList.add(c));

        let infoContent = document.createElement("div");
        infoContent.id = this.encryptedInfoTextContent.label;
        infoContent.classList.add(this.INFO_CONTENT_CLASS);

        let infoText = document.createElement("div");
        infoText.id = this.encryptedInfoText.label;
        infoText.classList.add(this.INFO_TEXT_CLASS);

        //always start off encrypted
        infoText.innerHTML = this.formatEncryptedText();

        let loader = this.loader.create();
        loader.classList.add("hide");

        infoContent.appendChild(loader);
        infoContent.appendChild(infoText);

        element.appendChild(infoContent);

        if(this.encryptedInfo) {
            let button = this.toggleButton.create();
            element.appendChild(button);
        }

        return element;
    }

    toggle() {}

    setup() {
        if(!this.encryptedInfo) return;

        this.toggleButton.addEventListener(['click'], async function() {
            this.encrypted = !this.encrypted;
            this.encryptedInfoText.getElement().innerHTML = "";
            this.loader.show();

            try {
                await this.setTextAsync();
            } catch(e) {
                if(e instanceof AppError) {
                    if(e.isType(AppErrorType.GENERATING_MASTER_KEY)) {
                        console.log(e);
                        this.encrypted = !this.encrypted; //change back to previous state
                        await this.setTextAsync();
                    } else if(e.isType(AppErrorType.MISSING_MASTER_PASSWORD)) {
                        console.log(e);
                        this.encrypted = !this.encrypted; //change back to previous state
                    }
                }
            }
            this.loader.hide();
        }.bind(this));
    }

    async setTextAsync() {
        if(!this.encryptedInfo) return this.emptyFieldText;

        let text;
        if(this.encrypted) {
            text = this.formatEncryptedText();
        } else {
            text = await this.decryptText(this.encryptedInfo);
        }
        if(this.encrypted) { //double check the state in case decryption is complete later but we're back to encrypted
            text = this.formatEncryptedText();
        }
        this.encryptedInfoText.getElement().innerHTML = text;
    }

    async decryptText(text) {
        return await this.app.decryptPassEntryPassword(text, this.page, this);
    }

    formatEncryptedText() {
        if(!this.encryptedInfo) return this.emptyFieldText;

        return this.encryptedPlaceholderText ? this.encryptedPlaceholderText : this.encryptedInfo;
    }
}

class MainPassEntryRow extends Component {
    constructor(app, page, entry) {
        super("id", "main-entry-" + entry.getField("tag"), page, app);
        this.tag = entry.getField("tag");
        let exportedEntry = entry.export(true);
        this.entry = Object.entries(exportedEntry);

        this.ENTRY_ROW_CLASSES = "h hv-c vh-c entry-row".split(" ");
        this.ENTRY_COL_CLASS = "entry-col";
        this.EMPTY_FIELD_TEXT = "-";
        
        let passEntryConfig = this.config.EntryConfig;

        this.PASSWORD_HIDDEN_TEXT = "********";
        this.PASSWORD_HEADER = passEntryConfig.password.value;
        this.passwordEncryptedInformation = new EncryptedInformation(app, page, this.tag, this.PASSWORD_HEADER, exportedEntry[this.PASSWORD_HEADER], this.PASSWORD_HIDDEN_TEXT);    
        
        this.WEBSITE_HEADER = passEntryConfig.website.value;
        this.LINK_ID = "link";
        this.LINK_CLASS = "entry-website-link";
    }

    create() {
        let element = document.createElement("div");
        element.id = this.label;
        this.ENTRY_ROW_CLASSES.forEach(c => element.classList.add(c));

        // Populate entry rows with entry fields
        this.entry.forEach(field => {
            let header = field[0];
            let content = field[1];
            let entryColElement = document.createElement("div");
            entryColElement.id = this.tag + "-" + header; //Eg. Google-Tag
            entryColElement.classList.add(this.ENTRY_COL_CLASS);
            
            if(header === this.PASSWORD_HEADER) {
                entryColElement.appendChild(this.passwordEncryptedInformation.create());
            } else if (header === this.WEBSITE_HEADER && content) {
                if(content.match(this.app.WEBSITE_REGEXP)) {
                    let address = content;
                    let link = document.createElement("a");
                    link.href = "//" + content; //stops from appending onto current url
                    link.id = this.tag + "-" + this.LINK_ID; //Eg. Google-link
                    link.target = "_blank";
                    link.classList.add(this.LINK_CLASS);
                    link.innerHTML = address;
                    entryColElement.appendChild(link);
                } else {
                    entryColElement.innerHTML = content;
                }
            } else {
                entryColElement.innerHTML = content ? content : this.EMPTY_FIELD_TEXT;
            }

            element.appendChild(entryColElement);
        })
        return element;
    }

    setup() {
        this.passwordEncryptedInformation.setup();
    }
}

class MainHeaderRow extends Component {
    constructor(app, page) {
        super("id", "main-entry-header-row", page, app);
        this.tableHeaders = Object.keys(this.config.EntryConfig.forTableFields);

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

class AddPassEntryButton extends IconButton {
    constructor(app, page) {
        super(app, page, "add-new-pass-entry-button", "playlist_add");
    }
}

class MainTable extends Component {
    constructor(app, page) {
        super("id", "main-table", page, app);

        this.headerRow = new MainHeaderRow(app, page);
        this.headerRowDivider = new MainHeaderRowDivider(app, page);
        this.dividers = new MainRowDivider(app, page);
        this.addPassEntryButton = new AddPassEntryButton(app, page);
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
            this.addPassEntryButton = new AddPassEntryButton(this.app, this.page);

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
        
        this.setup();
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
            this.passEntryRows.push(new MainPassEntryRow(this.app, this.page, e));
        })
    }

    setup() {
        this.setupAddPassEntryButton();
        this.passEntryRows.forEach(r => {
            r.setup();
        })
    }

    setupAddPassEntryButton() {
        this.addPassEntryButton.addEventListener(["click"], function() {
            this.app.goToEditPage("add", this.page);
        }.bind(this));
    }
}

class MainOptionsSearch extends Component {
    constructor(app, page) {
        super("id", "main-page-option-search", page, app);
    }

    create() {
    }

    setup() {

    }
}

class MainOptionsDownload extends Component {
    constructor(app, page) {
        super("id", "main-page-option-download", page, app);
        this.button = new IconButton(app, page, "main-page-option-download-button", "download");
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
    constructor(app, page, tag) {
        super("id", "edit-text-input-" + tag, page, app);

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
    constructor(app, page, tag) {
        super("id", "edit-text-area-" + tag, page, app);

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
    constructor(app, page) {
        super("id", "edit-view", page, app);

        this.config = app.passManager.config;

        this.inputs = {}
        let passEntryConfig = this.config.EntryConfig;
        passEntryConfig.allFields.forEach(field => {
            if(passEntryConfig[field].isArray) {
                this.inputs[field] = new EditTextArea(app, page, field);
            } else {
                this.inputs[field] = new EditTextInput(app, page, field);
            }
        })
        this.inputs.password.setInputType("password");

        this.confirmButton = new IconButton(app, page, "edit-view-confirm-button", "check_circle");

        this.cancelButton = new IconButton(app, page, "edit-view-cancel-button", "cancel");

        this.EDIT_VIEW_ROW_ID_PREFIX = "edit-view-row-";
        this.EDIT_VIEW_CLASSES = "v hv-l vh-c".split(" ");
        this.EDIT_VIEW_ROW_CLASSES = "h hv-c vh-c edit-view-row".split(" ");
        this.EDIT_VIEW_ROW_HEADER_CLASS = "h hv-r vh-c edit-view-row-header".split(" ");
        this.EDIT_VIEW_ROW_INPUT_CLASS = "edit-view-row-input";
        this.EDIT_VIEW_FOOTER_ROW_CLASSES = "h hv-c vh-c edit-view-row".split(" ");
    }

    create() {
        let element = document.createElement("div");
        element.id = this.label;
        this.EDIT_VIEW_CLASSES.forEach(c => element.classList.add(c));
        element.style.maxHeight = is_mobile_or_tablet_view() ? "60vh" : "600px";

        Object.entries(this.inputs).forEach(entry => {
            let header = entry[0];
            let input = entry[1];

            let row = document.createElement("div");
            row.id = this.EDIT_VIEW_ROW_ID_PREFIX + header;
            this.EDIT_VIEW_ROW_CLASSES.forEach(c => row.classList.add(c));

            let rowHeader = document.createElement("div");
            this.EDIT_VIEW_ROW_HEADER_CLASS.forEach(c => rowHeader.classList.add(c));

            rowHeader.innerHTML = capitalize(header) + ":";

            let inputElement = input.create();
            inputElement.classList.add(this.EDIT_VIEW_ROW_INPUT_CLASS);
            
            row.appendChild(rowHeader);
            row.appendChild(inputElement);

            element.appendChild(row);
        })

        let footer = document.createElement("div");
        this.EDIT_VIEW_FOOTER_ROW_CLASSES.forEach(c => footer.classList.add(c));

        footer.appendChild(this.cancelButton.create());
        footer.appendChild(this.confirmButton.create());

        element.appendChild(footer);
        
        super.create();
        return element;
    }

    setup() {
        this.cancelButton.addEventListener(["click"], function() {
            this.app.goToMainPage(this.page, false);
        }.bind(this));

        this.confirmButton.addEventListener(["click"], function() {
            let entry = this.convertInputValuesToEditPageEntry();
            this.validateValues(entry);
            this.app.confirmEditPageEntry(entry, this.page);
        }.bind(this));
    }

    convertInputValuesToEditPageEntry() {
        let out = {};
        let passEntryConfig = this.config.EntryConfig;
        passEntryConfig.allFields.forEach(field => {
            let value = this.inputs[field].getElement().value;
            if(value){
                if(passEntryConfig[field].isArray) {
                    value = value.split("\n");
                }
                out[field] = value;
            }
        })
        return out;
    }

    validateValues(entry) {
        if(!entry.tag) {
            throw new Error("Entry must have a tag");
        }
        if(this.app.passManager.entryAlreadyExistsWithTag(entry.tag)) {
            throw new Error("Entry cannot have same tag as existing entries");
        }
        if(entry.website) {
            if(!entry.website.match(this.app.WEBSITE_REGEXP)) {
                console.log(entry.website);
                throw new Error("Website must have a valid website");
            }
        }
    }

    clearInputs() {
        Object.values(this.inputs).forEach(input => {
            input.getElement().value = "";
        });
    }
}