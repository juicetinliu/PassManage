const HtmlTypes = {
    CLASS: "CLASS",
    ID: "ID"
};

//helper function to create element with id and class on one line
function documentCreateElement(elementType, id = null, classes = null) {
    let element = document.createElement(elementType);
    if(id) element.id = id;
    if(classes) {
        if(Array.isArray(classes)) {
            classes.forEach(c => element.classList.add(c));
        } else {
            element.classList.add(classes);
        }
    }
    return element
}

class Element { //Any element that exists in HTML
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

class Component extends Element{ //reusable, functional, and created elements
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

class MainRowDivider extends Component {
    constructor(app, page) {
        super("class", "divider", page, app);
    }

    create() {
        let element = documentCreateElement("div", null, this.label);
        return element;
    }
}

class MainHeaderRowDivider extends Component {
    constructor(app, page) {
        super("class", "header-divider", page, app);

        this.DIVIDER_CLASS = "divider";
    }

    create() {
        let element = documentCreateElement("div", null, [this.label, this.DIVIDER_CLASS]);
        return element;
    }
}

class Button extends Component {
    constructor(app, page, id) {
        super("id", id, page, app);
        this.disabled = false;
        this.BUTTON_CLASS = "butt";
    }

    create() {
        let element = documentCreateElement("button", this.label, this.BUTTON_CLASS);
        super.create();
        return element;
    }
}

class MaterialIcon extends Component {
    constructor(app, page, id, iconName) {
        super("id", id + "-icon", page, app);
        this.iconName = iconName;
        this.disabled = false;
        this.ICON_CLASS = "material-symbols-rounded";
        this.DISABLED_ICON_CLASS = "material-symbols-rounded-disabled";
    }

    create() {
        let element = documentCreateElement("span", this.label, this.ICON_CLASS);
        if(this.disabled) element.classList.add(this.DISABLED_ICON_CLASS); 
        element.innerHTML = this.iconName;
        super.create();
        return element;
    }

    disable() {
        this.disabled = true;
        this.getElement().classList.add(this.DISABLED_ICON_CLASS);
    }

    enable() {
        this.disabled = false;
        this.getElement().classList.remove(this.DISABLED_ICON_CLASS);
    }

    setIcon(iconName) {
        this.iconName = iconName;
        if(this.exists()) this.getElement().innerHTML = iconName;
    }
}

class IconButton extends Button {
    constructor(app, page, id, iconName) {
        super(app, page, id);
        this.icon = new MaterialIcon(this.app, this.page, this.label, iconName);
        this.disabled = false;
        this.MAIN_BUTTON_CLASS = "butt-main";
        this.MAIN_BUTTON_DISABLED_CLASS = "butt-main-disabled";
    }

    create() {
        let element = super.create();
        element.classList.add(this.MAIN_BUTTON_CLASS);
        if(this.disabled) element.classList.add(this.MAIN_BUTTON_DISABLED_CLASS); 

        let icon = this.icon.create();
        element.appendChild(icon);
        return element;
    }

    disable() {
        this.disabled = true;
        this.getElement().classList.add(this.MAIN_BUTTON_DISABLED_CLASS);
        this.getElement().disabled = true;
        this.icon.disable();
    }

    enable() {
        this.disabled = false;
        this.getElement().classList.remove(this.MAIN_BUTTON_DISABLED_CLASS);
        this.getElement().disabled = false;
        this.icon.enable();
    }

    setIcon(iconName) {
        this.icon.setIcon(iconName);
    }
}

class EncryptedInformationToggleButton extends IconButton {
    constructor(app, page, tag){
        super(app, page, "encrypted-info-toggle-button-" + tag, "visibility_off");
        this.DECRYPTED_ICON_NAME = "visibility";
        this.ENCRYPTED_ICON_NAME = "visibility_off";
        this.visible = false;

        this.CLASS = 'encrypted-info-toggle-button';
    }

    create() {
        let element = super.create();
        element.classList.add(this.CLASS);
        
        return element;
    }

    toggleVisiblity(visible) {
        this.visible = visible;
        this.setIcon(visible ? this.ENCRYPTED_ICON_NAME : this.DECRYPTED_ICON_NAME);
    }
}

class SmallSquareLoader extends Component {
    constructor(app, page, id) {
        super("id", id, page, app);
        this.SMALL_SQUARE_LOADER_CLASSES = "small-square-loader".split(" ");
    }

    create() {
        let element = documentCreateElement("div", this.label, this.SMALL_SQUARE_LOADER_CLASSES);

        element.appendChild(documentCreateElement("div"));
        element.appendChild(documentCreateElement("div"));
        element.appendChild(documentCreateElement("div"));
        element.appendChild(documentCreateElement("div"));
        
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


        this.MAIN_CONTENT_CLASS = "encrypted-info-content-" + passEntryField;
        this.CONTENT_CLASSES = (this.MAIN_CONTENT_CLASS + " h hv-l vh-c").split(" ");
        this.INFO_CONTENT_CLASS = "encrypted-info-text-content-" + passEntryField;
        this.INFO_TEXT_CLASS = "encrypted-info-text-" + passEntryField;

        if(info) {
            this.toggleButton = new EncryptedInformationToggleButton(app, page, tag);
        }
        
        this.encryptedInfoTextContent = new Element("id", "encrypted-info-text-content-" + passEntryField + "-" + tag);
        
        this.encryptedInfoText = new Element("id", "encrypted-info-text-" + passEntryField + "-" + tag);

        this.loader = new SmallSquareLoader(app, page, "encrypted-info-loader-" + passEntryField + "-" + tag);

        this.encrypted = true;
    }

    create() {
        let element = documentCreateElement("div", this.label, this.CONTENT_CLASSES);

        let infoContent = documentCreateElement("div", this.encryptedInfoTextContent.label, this.INFO_CONTENT_CLASS);

        let infoText = documentCreateElement("div", this.encryptedInfoText.label, this.INFO_TEXT_CLASS);

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

    setup() {
        if(!this.encryptedInfo) return;

        this.toggleButton.addEventListener(['click'], async function() {
            this.encrypted = !this.encrypted;
            this.toggleButton.toggleVisiblity(this.encrypted);
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
        this.fullEntry = entry.export(false);
        let exportedEntry = entry.export(true);
        this.entry = exportedEntry;

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

        this.editEntryButton = new IconButton(app, page, this.tag + "-edit-entry-button", "edit");
        this.EDIT_ENTRY_BUTTON_CLASS = "entry-row-button";

        this.editing = false;
    }

    create() {
        let element = documentCreateElement("div", this.label, this.ENTRY_ROW_CLASSES);

        // Populate entry rows with entry fields
        Object.entries(this.entry).forEach(field => {
            let header = field[0];
            let content = field[1];
            let entryColElement = documentCreateElement("div", this.tag + "-" + header, this.ENTRY_COL_CLASS); //Eg. id="Google-tag"
            
            if(header === this.PASSWORD_HEADER) {
                entryColElement.appendChild(this.passwordEncryptedInformation.create());
            } else if (header === this.WEBSITE_HEADER && content) {
                if(content.match(this.app.WEBSITE_REGEXP)) {
                    let address = content;
                    
                    let link = documentCreateElement("a", this.tag + "-" + this.LINK_ID, this.LINK_CLASS); //Eg. id=Google-link
                    link.href = "//" + content; //stops from appending onto current url
                    link.target = "_blank";
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
        let editEntryButton = this.editEntryButton.create();
        editEntryButton.classList.add(this.EDIT_ENTRY_BUTTON_CLASS);
        element.appendChild(editEntryButton);
        return element;
    }

    setup() {
        this.passwordEncryptedInformation.setup();
        this.toggleEditing(this.editing);
        this.editEntryButton.addEventListener(['click'], function() {
            this.app.goToEditPage("edit", this.page, this.fullEntry);
        }.bind(this));
    }

    toggleEditing(editing) {
        this.editing = editing;
        if(this.editing) {
            this.editEntryButton.show();
        } else {
            this.editEntryButton.hide();
        }
    }
}

class MainHeaderRow extends Component {
    constructor(app, page) {
        super("id", "main-entry-header-row", page, app);
        this.tableHeaders = Object.keys(this.config.EntryConfig.forTableFields);

        this.HEADER_ROW_CLASS = "header-row";
        this.ENTRY_ROW_CLASSES = "h hv-c vh-c entry-row".split(" ");
        this.ENTRY_COL_CLASS = "entry-col";
        this.HEADER_COL_ID_PREFIX = "header-col-"

        this.EDITING_CLASS = "header-row-editing";

        this.editing = false;
    }

    create() {
        // Create header row
        let element = documentCreateElement("div", this.label, this.ENTRY_ROW_CLASSES);
        element.classList.add(this.HEADER_ROW_CLASS);

        // Populate header row with headers
        this.tableHeaders.forEach(header => {
            let headerColElement = documentCreateElement("div", this.HEADER_COL_ID_PREFIX + header, this.ENTRY_COL_CLASS);
            headerColElement.innerHTML = capitalize(header);
            element.appendChild(headerColElement);
        })
        return element;
    }

    toggleEditing(editing) {
        this.editing = editing;
        if(this.editing) {
            this.getElement().classList.add(this.EDITING_CLASS);
        } else {
            this.getElement().classList.remove(this.EDITING_CLASS);
        }

    }
}

class MainTable extends Component {
    constructor(app, page) {
        super("id", "main-table", page, app);

        this.headerRow = new MainHeaderRow(app, page);
        this.headerRowDivider = new MainHeaderRowDivider(app, page);
        this.passEntryRows = [];
        this.dividers = new MainRowDivider(app, page);

        this.ENTRY_TABLE_CLASSES = "v hv-l vh-c entry-table".split(" ");

        this.MAIN_TABLE_HEADER_CONTENT_ID = "main-table-header-content";
        this.MAIN_TABLE_ENTRY_CONTENT_ID = "main-table-entry-content";
        this.MAIN_TABLE_FOOTER_CONTENT_ID = "main-table-footer-content";
        this.TABLE_CONTENT_CLASSES = "v hv-l vh-c entry-table-content".split(" ");

        this.NO_ENTRIES_MESSAGE = "No entries to show";
        this.NO_ENTRIES_ADD_ICON_NAME = "add";
        this.ENTRIES_ADD_ICON_NAME = "playlist_add";
        
        this.addPassEntryButton = new IconButton(app, page, "add-new-pass-entry-button", this.NO_ENTRIES_ADD_ICON_NAME);

        this.editing = false;
    }

    updateEntries(entries = []) {
        if(!this.created) {
            this.create(entries);
        } else {
            let entryContent = new Element("id", this.MAIN_TABLE_ENTRY_CONTENT_ID);
            entryContent.removeChildren();

            this._populateEntryContent(entryContent.getElement(), entries);
        }
        
        this.setup(true);
    }

    create(entries = []) {
        let element = documentCreateElement("div", this.label, this.ENTRY_TABLE_CLASSES);
        element.style.maxHeight = is_mobile_or_tablet_view() ? "60vh" : "600px";

        let headerContent = documentCreateElement("div", this.MAIN_TABLE_HEADER_CONTENT_ID, this.TABLE_CONTENT_CLASSES);

        let headerRow = this.headerRow.create();
        let headerRowDivider = this.headerRowDivider.create();

        headerContent.appendChild(headerRow);
        headerContent.appendChild(headerRowDivider);

        let entryContent = documentCreateElement("div", this.MAIN_TABLE_ENTRY_CONTENT_ID, this.TABLE_CONTENT_CLASSES);

        let addPassEntryButton = this.addPassEntryButton.create();
        
        this._populateEntryContent(entryContent, entries);

        let footerContent = documentCreateElement("div", this.MAIN_TABLE_FOOTER_CONTENT_ID, this.TABLE_CONTENT_CLASSES);

        footerContent.appendChild(addPassEntryButton);

        element.appendChild(headerContent);
        element.appendChild(entryContent);
        element.appendChild(footerContent);

        super.create();
        return element;
    }

    _populateEntryContent(entryContentElement, entries) {
        this._setPassEntryRows(entries);
        if(this.passEntryRows.length > 0){
            this.passEntryRows.forEach(row => {
                let passEntryRow = row.create();
                entryContentElement.appendChild(passEntryRow);
                entryContentElement.appendChild(this.dividers.create());
            });
            this.addPassEntryButton.setIcon(this.ENTRIES_ADD_ICON_NAME);
            this.page.components.mainDownloadButton.enable();
            this.page.components.mainEditButton.enable();
        } else {
            this.addPassEntryButton.setIcon(this.NO_ENTRIES_ADD_ICON_NAME);
            entryContentElement.innerHTML = this.NO_ENTRIES_MESSAGE;
            this.page.components.mainDownloadButton.disable();
            this.page.components.mainEditButton.disable();
        }
    }

    _setPassEntryRows(entries) {
        this.passEntryRows = [];
        entries.forEach(e => {
            this.passEntryRows.push(new MainPassEntryRow(this.app, this.page, e));
        })
    }

    toggleEditing(editing) {
        this.editing = editing;
        this.passEntryRows.forEach(r => {
            r.toggleEditing(this.editing);
        })
        this.headerRow.toggleEditing(this.editing);
    }

    setup(update = false) {
        if(!update) this._setupAddPassEntryButton();
        this._setupPassEntryRows();
        this.toggleEditing(this.editing);
    }

    _setupPassEntryRows() {
        this.passEntryRows.forEach(r => {
            r.setup();
        })
    }

    _setupAddPassEntryButton() {
        this.addPassEntryButton.addEventListener(["click"], function() {
            this.app.goToEditPage("add", this.page);
        }.bind(this));
    }
}

class MainOptionsEdit extends Component {
    constructor(app, page) {
        super("id", "main-page-option-edit", page, app);

        this.editing = false;
        this.EDITING_MODE_BUTTON_CLASS = "main-page-option-edit-button-editing";
        this.START_EDITING_ICON_NAME = "edit_note";
        this.STOP_EDITING_ICON_NAME = "edit";
        this.button = new IconButton(app, page, "main-page-option-edit-button", this.START_EDITING_ICON_NAME);
    }

    create() {
        let element = documentCreateElement("div", this.label);
        element.appendChild(this.button.create());

        return element;
    }

    setup() {
        this.button.addEventListener(["click"], function() {
            this.editing = !this.editing;
            this.toggleEditing(this.editing);
            this.page.toggleEditing(this.editing);
        }.bind(this));
    }

    toggleEditing(editing) {
        if(editing) {
            this.button.getElement().classList.add(this.EDITING_MODE_BUTTON_CLASS);
            this.button.setIcon(this.STOP_EDITING_ICON_NAME);
        } else {
            this.button.getElement().classList.remove(this.EDITING_MODE_BUTTON_CLASS);
            this.button.setIcon(this.START_EDITING_ICON_NAME);
        }
    }

    disable() {
        this.button.disable();
    }

    enable() {
        this.button.enable();
    }
}

class MainOptionsSearch extends Component {
    constructor(app, page) {
        super("id", "main-page-option-search", page, app);

        this.inputLabel = "input-search"
        this.input = new Element("id", this.inputLabel);
        this.icon = new MaterialIcon(app, page, this.inputLabel, "search");
        
        this.SEARCH_PANEL_CLASSES = "p p-out p-round".split(" ");
        this.SEARCH_PLACEHOLDER_TEXT_OPTIONS = ["Search for anything...", "Search for something...", "What are you looking for?", "Type something to search...", "What do you want?", "Finding something?"];
        this.TEXT_INPUT_CLASS = "text-input";
        this.INPUT_SEARCH_FOCUS_CLASS = "input-search-focus";
        this.ICON_DISABLED_CLASS = "input-search-icon-disabled";
        this.inputType = "text";
    }

    create() {
        let element = documentCreateElement("div", this.label, this.SEARCH_PANEL_CLASSES);

        let icon = this.icon.create();

        let input = documentCreateElement("input", this.inputLabel, this.TEXT_INPUT_CLASS);
        input.type = this.inputType;
        input.name = this.inputLabel;
        
        element.appendChild(icon);
        element.appendChild(input);

        return element;
    }

    setup() {
        this.input.addEventListener(["focus"], function() {
            this._toggleSearchFocus(true);
        }.bind(this));

        this.input.addEventListener(["focusout"], function() {
            this._toggleSearchFocus(false);
        }.bind(this));
    }

    _toggleSearchFocus(focusIn) {
        this.input.getElement().placeholder = focusIn ? this._getRandomSearchPlaceholder() : "";
        if(focusIn) {
            this.icon.getElement().classList.add(this.ICON_DISABLED_CLASS);
            this.input.getElement().style.width = "250px";
        } else {
            if(!this.getSearchValue()) {
                this.icon.getElement().classList.remove(this.ICON_DISABLED_CLASS);
                this.input.getElement().style.width = "150px";
            }
        }
    }

    getSearchValue() {
        return this.input.getElement().value;
    }

    _getRandomSearchPlaceholder() {
        let ind = Math.floor(Math.random() * this.SEARCH_PLACEHOLDER_TEXT_OPTIONS.length);
        return this.SEARCH_PLACEHOLDER_TEXT_OPTIONS[ind];
    }
}

class MainOptionsDownload extends Component {
    constructor(app, page) {
        super("id", "main-page-option-download", page, app);
        this.button = new IconButton(app, page, "main-page-option-download-button", "download");
    }

    create() {
        let element = documentCreateElement("div", this.label);
        element.appendChild(this.button.create());

        return element;
    }

    setup() {
        this.button.addEventListener(["click"], function() {
            this.app.downloadPassFile();
        }.bind(this));
    }

    disable() {
        this.button.disable();
    }

    enable() {
        this.button.enable();
    }
}

class EditTextInput extends Component {
    constructor(app, page, tag) {
        super("id", "edit-text-input-" + tag, page, app);

        this.TEXT_INPUT_CLASS = "text-input";
        this.inputType = "text";
    }

    create() {
        let element = documentCreateElement("input", this.label, this.TEXT_INPUT_CLASS);
        element.type = this.inputType;
        element.name = this.label;

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
        let element = documentCreateElement("textarea", this.label, this.TEXT_AREA_CLASS);
        element.name = this.label;

        return element;
    }
}

class EditView extends Component {
    constructor(app, page) {
        super("id", "edit-view", page, app);

        this.config = app.passManager.config;

        this.actionTypes = page.actionTypes;

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

        this.PASSWORD_HEADER = passEntryConfig.password.value;
        this.EDIT_PASSWORD_MESSAGE = "Type to change old password";
        this.SECRETS_HEADER = passEntryConfig.secrets.value;
        this.EDIT_SECRETS_MESSAGE = "Type to change old secrets";

        this.action;
    }

    create() {
        let element = documentCreateElement("div", this.label, this.EDIT_VIEW_CLASSES);
        element.style.maxHeight = is_mobile_or_tablet_view() ? "60vh" : "600px";

        Object.entries(this.inputs).forEach(entry => {
            let header = entry[0];
            let input = entry[1];

            let row = documentCreateElement("div", this.EDIT_VIEW_ROW_ID_PREFIX + header, this.EDIT_VIEW_ROW_CLASSES);

            let rowHeader = documentCreateElement("div", null, this.EDIT_VIEW_ROW_HEADER_CLASS);

            rowHeader.innerHTML = capitalize(header) + ":";

            let inputElement = input.create();
            inputElement.classList.add(this.EDIT_VIEW_ROW_INPUT_CLASS);
            
            row.appendChild(rowHeader);
            row.appendChild(inputElement);

            element.appendChild(row);
        })

        let footer = documentCreateElement("div", null, this.EDIT_VIEW_FOOTER_ROW_CLASSES);

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
                    value = value.split(this.config.PassEntryInputArraySeparator);
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
        if(this.action === this.actionTypes.ADD) {
            if(this.app.passManager.entryAlreadyExistsWithTag(entry.tag)) {
                throw new Error("ADD: Entry cannot have same tag as existing entries");
            }
        } else if(this.action === this.actionTypes.EDIT) {
            if(this.app.passManager.entryAlreadyExistsWithTag(entry.tag, this.page.editEntry.tag)) {
                throw new Error("EDIT: Entry cannot have same tag as existing entries");
            }
        }
        if(entry.website) {
            if(!entry.website.match(this.app.WEBSITE_REGEXP)) {
                console.log(entry.website);
                throw new Error("Website must have a valid website");
            }
        }
    }

    populateInputs(entry) {
        let passEntryConfig = this.config.EntryConfig;

        Object.entries(entry).forEach(entryField => {
            let header = entryField[0];
            let content = entryField[1];
            if(passEntryConfig[header].isEncrypted) {
                content = null;
                if(header === this.PASSWORD_HEADER) {
                    this.inputs[header].getElement().placeholder = this.EDIT_PASSWORD_MESSAGE;
                } else if(header === this.SECRETS_HEADER) {
                    this.inputs[header].getElement().placeholder = this.EDIT_SECRETS_MESSAGE;
                }
            } else {
                if(passEntryConfig[header].isArray) {
                    content = content.join(this.config.PassEntryInputArraySeparator);
                }
            }
            this.inputs[header].getElement().value = content;
        });
    }

    reset() {
        Object.values(this.inputs).forEach(input => {
            input.getElement().value = "";
            input.getElement().style = null;
            input.getElement().placeholder = "";
        });
    }

    setAction(action) {
        this.action = action;
    }
}