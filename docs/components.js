import { CacheKeys } from "./cacher.js";

const HtmlTypes = {
    CLASS: "CLASS",
    ID: "ID"
};

//helper function to create element with id and class on one line
export function documentCreateElement(elementType, id = null, classes = null) {
    let element = document.createElement(elementType);
    if(id) element.id = id;
    if(classes) {
        if(Array.isArray(classes)) {
            classes.forEach(c => element.classList.add(c));
        } else {
            element.classList.add(classes);
        }
    }
    return element;
}

export class Element { //Any element that exists in HTML
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

export class Component extends Element{ //reusable, functional, and created elements
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

export class Tooltip extends Component {
    constructor(app, page, id, tooltipText = "", type = "DEFAULT") {
        super("id", "tooltip-" + id, page, app);
        this.TOOLTIP_CLASSES = "tooltip".split(" ");

        this.TEXT_WRAPPER_ID = this.label + "-text";
        this.textWrapper = new Element("id", this.TEXT_WRAPPER_ID);
        this.tooltipText = tooltipText;

        this.TOOLTIP_SIDES = {
            LEFT: "tooltip-left",
            RIGHT: "tooltip-right",
            TOP: "tooltip-top",
            BOTTOM: "tooltip-bottom"
        }
        this.attachedToComponent = null;
        this.TOOLTIP_SHOW_CLASS = "tooltip-show";

        this.TOOLTIP_TYPES = {
            DEFAULT: "tooltip-default",
            ERROR: "tooltip-error",
        }
        if(Object.keys(this.TOOLTIP_TYPES).indexOf(type) < 0) throw new Error("Invalid tooltip type: " + type);
        this.TOOLTIP_CLASSES.push(this.TOOLTIP_TYPES[type]);
    }

    create() {
        let element = documentCreateElement("div", this.label, this.TOOLTIP_CLASSES);

        let textWrapper = documentCreateElement("div", this.TEXT_WRAPPER_ID);
        textWrapper.innerHTML = this.tooltipText;

        element.appendChild(textWrapper);
        return element;
    }

    setup() {
        this.addEventListener(["click"], () => {
            this.hide();
        });
    }

    createAndAlignToComponent(component, side = "BOTTOM") {
        let element = component.getElement();
        if(element.nodeName !== "DIV") throw new Error("Tooltip can only be attached to a div element");
        if(element.style.position && element.style.position !== "relative") throw new Error("Relative position not safe to apply to attaching component");

        if(!this.TOOLTIP_SIDES[side]) throw new Error(side + " is not a valid Tooltip side");
        
        this.attachedToComponent = component;
        element.style.position = "relative";

        let tooltip = this.create();
        tooltip.classList.add(this.TOOLTIP_SIDES[side]);

        element.appendChild(tooltip);
    }

    setText(text) {
        this.textWrapper.getElement().innerHTML = text;
    }

    show() {
        let elementExists = this.exists();
        if(elementExists) {
            elementExists.classList.add(this.TOOLTIP_SHOW_CLASS);
        } else {
            this.throwNotFoundError();
        }
    }

    hide() {
        let elementExists = this.exists();
        if(elementExists) {
            elementExists.classList.remove(this.TOOLTIP_SHOW_CLASS);
        } else {
            this.throwNotFoundError();
        }
    }
}

class Divider extends Component {
    constructor(app, page, otherClasses = null) {
        super("class", "divider", page, app);

        this.otherClasses = otherClasses;
    }

    create() {
        let element = documentCreateElement("div", null, this.label);
        if(this.otherClasses) element.classList.add(this.otherClasses);
        return element;
    }
}

class MainRowDivider extends Divider {
    constructor(app, page) {
        super(app, page, "row-divider");
    }
}

class MainHeaderRowDivider extends Divider {
    constructor(app, page) {
        super(app, page, "header-divider");
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

class TextInput extends Component {
    constructor(app, page, id, inputType = "text") {
        super("id", id, page, app);
        this.TEXT_INPUT_CLASS = "text-input";
        this.inputType = inputType;
    }

    create() {
        let element = documentCreateElement("input", this.label, this.TEXT_INPUT_CLASS);
        element.type = this.inputType;
        element.name = this.label;
        super.create();
        return element;
    }

    setInputType(type) {
        this.inputType = type;
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

export class IconButton extends Button {
    constructor(app, page, id, iconName, hoverText = null) {
        super(app, page, id);
        this.icon = new MaterialIcon(this.app, this.page, this.label, iconName);
        this.disabled = false;
        this.MAIN_BUTTON_CLASS = "butt-main";
        this.MAIN_BUTTON_DISABLED_CLASS = "butt-main-disabled";
        this.hoverText = hoverText;
    }

    create() {
        let element = super.create();
        element.classList.add(this.MAIN_BUTTON_CLASS);
        if(this.disabled) element.classList.add(this.MAIN_BUTTON_DISABLED_CLASS); 
        if(this.hoverText) element.title = this.hoverText;

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
    constructor(app, page, label){
        super(app, page, label + "-toggle-button", "visibility_off", "Toggle encryption");
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
        this.SMALL_SQUARE_LOADER_CLASSES = "small-square-line-loader".split(" ");
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
            this.toggleButton = new EncryptedInformationToggleButton(app, page, this.label);
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

        this.toggleButton.addEventListener(['click'], () => {
            this.encrypted = !this.encrypted;
            this.toggleEncryption(this.encrypted);
        });
    }

    async toggleEncryption(encrypted) {
        this.toggleButton.toggleVisiblity(encrypted);
        this.encryptedInfoText.getElement().innerHTML = "";
        this.loader.show();

        try {
            await this.setTextAsync();
        } catch(e) {
            if(e instanceof AppError) {
                if(e.isType(AppErrorType.GENERATING_MASTER_KEY) || e.isType(AppErrorType.MISSING_MASTER_PASSWORD)) {
                    debugLog(e);
                    this.encrypted = !this.encrypted; //change back to previous state
                    await this.setTextAsync();
                    this.toggleButton.toggleVisiblity(this.encrypted);
                }
            } else {
                throw e;
            }
        }
        //check for existence in case entry is deleted after decryption
        if(this.exists()) this.loader.hide();
    }

    async setTextAsync() {
        let encryptedInfoTextElement = this.encryptedInfoText.getElement(); //fetch element in the beginning to avoid assigning text when table is updated and new rows entries are created (this function is still tied to old row entry)
        if(!this.encryptedInfo) return this.emptyFieldText;

        let text;
        if(this.encrypted) {
            text = this.formatEncryptedText();
        } else {
            text = await this.decryptText(this.encryptedInfo);
            let fieldConfig = this.config.EntryConfig[this.passEntryField];
            if(fieldConfig.isArray) {
                text = text.join(", ")
            }
            if(this.encrypted) { //double check the state in case decryption is completed later but we're back to an encrypted state
                text = this.formatEncryptedText();
            }
        }
        //check for existence in case entry is deleted after decryption
        if(this.exists()) encryptedInfoTextElement.innerHTML = text;
    }

    async decryptText(text) {
        return await this.app.decryptPassEntryField(this.passEntryField, text, this.page, this.toggleButton);
    }

    formatEncryptedText() {
        if(!this.encryptedInfo) return this.emptyFieldText;

        return this.encryptedPlaceholderText ? this.encryptedPlaceholderText : this.encryptedInfo;
    }

    forceEncrypt() {
        this.encrypted = true;
        if(this.encryptedInfo) this.toggleEncryption(this.encrypted);
    }
}

class MainPassEntryRowMoreInfo extends Component {
    constructor(app, page, entry) {
        super("id", "main-entry-more-info-" + entry.tag, page, app);
        this.tag = entry.tag
        this.entry = entry;
        this.MORE_INFO_CLASSES = "wrapper-row main-entry-more-info".split(" ");
        this.MORE_INFO_OPENED_CLASS = "main-entry-more-info-open";
        this.entry = entry;

        this.ITEM_CLASSES = "main-entry-more-info-content-item h hv-c vh-c p-round".split(" ");
        this.ITEM_HEADER_CLASS = "main-entry-more-info-content-item-header";
        this.ITEM_TEXT_CLASS = "main-entry-more-info-content-item-text";

        this.editEntryButton = new IconButton(app, page, this.tag + "-edit-entry-button", "edit", "Edit");
        this.deleteEntryButton = new IconButton(app, page, this.tag + "-delete-entry-button", "delete", "Delete");
        this.SHELF_BUTTON_CLASS = "entry-row-button";
        this.DELETE_BUTTON_CLASS = "delete-entry-button";

        this.SECRETS_HEADER = this.config.EntryConfig.secrets.value;
        this.SECRETS_HIDDEN_TEXT = "********";

        let entrySecrets = entry[this.SECRETS_HEADER];
        this.hasSecrets = false;

        if(entrySecrets.length) {
            this.hasSecrets = true;
            this.secretsEncryptedInformation = new EncryptedInformation(app, page, this.tag, this.SECRETS_HEADER, entry[this.SECRETS_HEADER], this.SECRETS_HIDDEN_TEXT);   
        }

        this.CONTENT_SCROLL_CLASS = "main-entry-more-info-content-wrapper";
        this.CONTENT_CLASSES = "h vh-t main-entry-more-info-content".split(" ");

        this.BUTTON_SHELF_CLASS = "main-entry-more-info-button-content v hv-l vh-c".split(" ");
    }

    create() {
        let element = documentCreateElement("div", this.label, this.MORE_INFO_CLASSES);

        let contentWrapper = documentCreateElement("div", null, this.CONTENT_CLASSES);
        
        let scrollWrapper = documentCreateElement("div", null, this.CONTENT_SCROLL_CLASS);

        let entryStuff = documentCreateElement("div", null, "h hv-l vh-c main-entry-more-info-content-stuff".split(" "));

        let passEntryConfig = this.config.EntryConfig;
        passEntryConfig.allFields.forEach(field => {
            let fieldConfig = passEntryConfig[field];
            if(!fieldConfig.forTable) {
                let thing = documentCreateElement("div", null, this.ITEM_CLASSES);
                let header = documentCreateElement("div", null, this.ITEM_HEADER_CLASS);
                header.innerHTML = fieldConfig.title + ": ";
                thing.appendChild(header);

                let content = null;
                if(field === this.SECRETS_HEADER){
                    if(this.hasSecrets) {
                        content = this.secretsEncryptedInformation.create();
                    }
                } else {
                    let passContent = this.entry[field];
                    if(fieldConfig.isArray) {
                        if(passContent.length) {
                            content = documentCreateElement("div", null, this.ITEM_TEXT_CLASS);
                            content.innerHTML = passContent.join(", ");
                        }
                    } else {
                        if(passContent) {
                            content = documentCreateElement("div", null, this.ITEM_TEXT_CLASS);
                            content.innerHTML = passContent;
                        }
                    }
                }
                if(content) {
                    thing.appendChild(content);
                    entryStuff.appendChild(thing);
                }
            }
        });
        scrollWrapper.appendChild(entryStuff);
        contentWrapper.appendChild(scrollWrapper)

        let buttonShelf = documentCreateElement("div", null, this.BUTTON_SHELF_CLASS);

        let editEntryButton = this.editEntryButton.create();
        editEntryButton.classList.add(this.SHELF_BUTTON_CLASS);
        buttonShelf.appendChild(editEntryButton);

        let deleteEntryButton = this.deleteEntryButton.create();
        deleteEntryButton.classList.add(this.DELETE_BUTTON_CLASS);
        deleteEntryButton.classList.add(this.SHELF_BUTTON_CLASS);
        buttonShelf.appendChild(deleteEntryButton);

        contentWrapper.appendChild(buttonShelf);
        element.appendChild(contentWrapper);
        return element;
    }

    close() {
        this.getElement().classList.remove(this.MORE_INFO_OPENED_CLASS);
        this.editEntryButton.disable();
        this.deleteEntryButton.disable();
        if(this.hasSecrets) this.secretsEncryptedInformation.toggleButton.disable();
    }

    open() {
        this.getElement().classList.add(this.MORE_INFO_OPENED_CLASS);   
        this.editEntryButton.enable();
        this.deleteEntryButton.enable(); 
        if(this.hasSecrets) this.secretsEncryptedInformation.toggleButton.enable();    
    }

    setup() {
        if(this.hasSecrets) this.secretsEncryptedInformation.setup();
        this.editEntryButton.addEventListener(['click'], () => {
            this.app.goToEditPage("edit", this.page, this.entry);
        });

        this.deleteEntryButton.addEventListener(['click'], () => {
            this.app.deleteEntry(this.entry, this.page);
        });
    }

    forceEncrypt() {
        if(this.secretsEncryptedInformation) this.secretsEncryptedInformation.forceEncrypt();
    }
}

class MainPassEntryRow extends Component {
    constructor(app, page, entry) {
        super("id", "main-entry-" + entry.getField("tag"), page, app);
        this.tag = entry.getField("tag");
        this.fullEntry = entry.export(false);
        let exportedEntry = entry.export(true);
        this.entry = exportedEntry;

        this.WRAPPER_CLASSES = "v hv-c vh-c wrapper-row".split(" ");
        this.ENTRY_ROW_CLASSES = "h hv-c vh-c entry-row".split(" ");
        this.ENTRY_COL_CLASS = "entry-col";
        this.EMPTY_FIELD_TEXT = "-";
        
        let passEntryConfig = this.config.EntryConfig;

        this.PASSWORD_HIDDEN_TEXT = "********";
        this.PASSWORD_HEADER = passEntryConfig.password.value;
        this.passwordEncryptedInformation = new EncryptedInformation(app, page, this.tag, this.PASSWORD_HEADER, exportedEntry[this.PASSWORD_HEADER], this.PASSWORD_HIDDEN_TEXT, this.EMPTY_FIELD_TEXT);    
        
        this.WEBSITE_HEADER = passEntryConfig.website.value;
        this.LINK_ID = "link";
        this.LINK_CLASS = "entry-website-link";

        this.SHOW_LESS_ICON_NAME = "expand_less";
        this.SHOW_MORE_ICON_NAME = "expand_more";
        this.showMoreButton = new IconButton(app, page, this.tag + "-show-more-button", this.SHOW_MORE_ICON_NAME, "More information");
        this.SHOW_MORE_BUTTON_CLASS = "entry-row-button";

        this.moreInfo = new MainPassEntryRowMoreInfo(app, page, this.fullEntry);

        this.showMore = false;
    }

    create() {
        let wrapper = documentCreateElement("div", this.label + "-wrapper", this.WRAPPER_CLASSES);
        let element = documentCreateElement("div", this.label, this.ENTRY_ROW_CLASSES);

        // Populate entry rows with entry fields
        Object.entries(this.entry).forEach(field => {
            let header = field[0];
            let content = field[1];
            let entryColElement = documentCreateElement("div", this.tag + "-" + header, this.ENTRY_COL_CLASS); //Eg. id="Google-tag"
            
            if(header === this.PASSWORD_HEADER) {
                entryColElement.appendChild(this.passwordEncryptedInformation.create());
            } else if (header === this.WEBSITE_HEADER && content) {
                if(content.match(this.app.CONSTANTS.WEBSITE_REGEXP)) {
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

        let showMoreButton = this.showMoreButton.create();
        showMoreButton.classList.add(this.SHOW_MORE_BUTTON_CLASS);
        element.appendChild(showMoreButton);
        let moreInfo = this.moreInfo.create();
       
        wrapper.appendChild(element);
        wrapper.appendChild(moreInfo);

        return wrapper;
    }

    setup() {
        this.passwordEncryptedInformation.setup();
        this.moreInfo.setup();

        this.toggleShowMore(this.showMore);
        this.showMoreButton.addEventListener(["click"], () => {
            this.showMore = !this.showMore;
            this.toggleShowMore(this.showMore);
        });
    }

    toggleShowMore(showMore) {
        if(showMore) {
            this.showMoreButton.setIcon(this.SHOW_LESS_ICON_NAME);
            this.moreInfo.open();
        } else {
            this.showMoreButton.setIcon(this.SHOW_MORE_ICON_NAME);
            this.moreInfo.close();
        }
    }

    forceEncrypt() {
        this.passwordEncryptedInformation.forceEncrypt();
        this.moreInfo.forceEncrypt();
    }
}

class MainHeaderRow extends Component {
    constructor(app, page) {
        super("id", "main-entry-header-row", page, app);
        let entryConfig = this.config.EntryConfig;
        this.tableHeaders = entryConfig.allFields.filter(f => entryConfig[f].forTable);

        this.HEADER_ROW_CLASS = "header-row";
        this.ENTRY_ROW_CLASSES = "h hv-c vh-c entry-row".split(" ");
        this.ENTRY_COL_CLASS = "entry-col";
        this.HEADER_COL_ID_PREFIX = "header-col-"
    }

    create() {
        // Create header row
        let element = documentCreateElement("div", this.label, this.ENTRY_ROW_CLASSES);
        element.classList.add(this.HEADER_ROW_CLASS);
        let entryConfig = this.config.EntryConfig;

        // Populate header row with headers
        this.tableHeaders.forEach(header => {
            let headerColElement = documentCreateElement("div", this.HEADER_COL_ID_PREFIX + header, this.ENTRY_COL_CLASS);
            headerColElement.innerHTML = entryConfig[header].title;
            element.appendChild(headerColElement);
        })
        return element;
    }
}

export class MainTable extends Component {
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
        
        this.addPassEntryButton = new IconButton(app, page, "add-new-pass-entry-button", this.NO_ENTRIES_ADD_ICON_NAME, "Add new entry");
    }

    closeAllMoreInfos() {
        this.passEntryRows.forEach(p => p.toggleShowMore(false));
    }

    scrollToEntryContentTop() {
        let entryContent = new Element("id", this.MAIN_TABLE_ENTRY_CONTENT_ID);
        entryContent.getElement().scrollTop = 0;
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
        } else {
            this.addPassEntryButton.setIcon(this.NO_ENTRIES_ADD_ICON_NAME);
            entryContentElement.innerHTML = this.NO_ENTRIES_MESSAGE;
            this.page.components.mainDownloadButton.disable();
        }
    }

    _setPassEntryRows(entries) {
        this.passEntryRows = [];
        entries.forEach(e => {
            this.passEntryRows.push(new MainPassEntryRow(this.app, this.page, e));
        })
    }

    setup(update = false) {
        if(!update) this._setupAddPassEntryButton();
        this._setupPassEntryRows();
    }

    _setupPassEntryRows() {
        this.passEntryRows.forEach(r => {
            r.setup();
        })
    }

    _setupAddPassEntryButton() {
        this.addPassEntryButton.addEventListener(["click"], () => {
            this.app.goToEditPage("add", this.page);
        });
    }

    forceEncrypt() {
        this.passEntryRows.forEach(p => p.forceEncrypt());
    }
}

export class MainOptionsKeyIndicator extends Component {
    constructor(app, page) {
        super("id", "main-page-option-key-indicator", page, app);

        this.KEY_VALID_ICON_NAME = "lock_open";
        this.KEY_INVALID_ICON_NAME = "lock";
        this.button = new IconButton(app, page, "main-page-option-key-indicator-button", this.KEY_INVALID_ICON_NAME);

        this.INDICATOR_WRAPPER_CLASSES = "h hv-r vh-c".split(" ");

        this.HIDE_TIMER_TEXT_DELAY_MS = 3000;
        this.showIndicatorTimerTextTimeout = null;
        this.NO_KEY_TEXT = "Locked";
        this.HELPER_TEXT = "Hold to refresh";
        this.INDICATOR_TIMER_ID = "main-page-option-key-indicator-timer";
        this.INDICATOR_TIMER_SHOW_CLASS = "main-page-option-key-indicator-timer-show";
        this.indicatorTimerText = new Element("id", this.INDICATOR_TIMER_ID);

        this.SVG_INDICATOR_LOADING_ID = "key-button-progress-indicator-loading";
        this.SVG_RECT_LOADING_ID = this.SVG_INDICATOR_LOADING_ID + "-rect";

        this.SVG_INDICATOR_ID = "key-button-progress-indicator";
        this.SVG_RECT_ID = this.SVG_INDICATOR_ID + "-rect";
        this.SVG_NAMESPACE = "http://www.w3.org/2000/svg";

        this.indicatorLoadingElement = new Element("id", this.SVG_RECT_LOADING_ID);
        this.indicatorElement = new Element("id", this.SVG_RECT_ID);
        this.INDICATOR_ZERO_CLASS = "key-button-progress-indicator-zero";
        this.INDICATOR_ELEMENT_MAX_VALUE = 110;

        this.indicatorPercentage = 0;

        this.longPressTimeout = null;
        this.longPressed = false;
        this.LONG_PRESS_DELAY_MS = 1000;
    }

    create() {
        let element = documentCreateElement("div", this.label);
        element.title = this.NO_KEY_TEXT;

        let wrapper = documentCreateElement("div", null, this.INDICATOR_WRAPPER_CLASSES);

        let timerText = documentCreateElement("div", this.INDICATOR_TIMER_ID);
        timerText.innerHTML = this.NO_KEY_TEXT;

        wrapper.appendChild(timerText);

        let button = this.button.create();

        //https://stackoverflow.com/questions/17520337/dynamically-rendered-svg-is-not-displaying
        let indicator = document.createElementNS(this.SVG_NAMESPACE, "svg");
        indicator.id = this.SVG_INDICATOR_ID;

        let rect = document.createElementNS(this.SVG_NAMESPACE, "rect");
        rect.id = this.SVG_RECT_ID;
        rect.classList.add(this.INDICATOR_ZERO_CLASS);

        let indicatorLoading = document.createElementNS(this.SVG_NAMESPACE, "svg");
        indicatorLoading.id = this.SVG_INDICATOR_LOADING_ID;

        let rectLoading = document.createElementNS(this.SVG_NAMESPACE, "rect");
        rectLoading.id = this.SVG_RECT_LOADING_ID;
        rectLoading.classList.add("hide");

        indicator.appendChild(rect);
        button.appendChild(indicator);

        indicatorLoading.appendChild(rectLoading);
        button.appendChild(indicatorLoading);
        wrapper.appendChild(button);

        element.appendChild(wrapper);
        return element;
    }

    setup() {
        this.app.passCacheTimer.addCallBack(this.setCacheIndicatorCallBack.bind(this));
        this.app.passCacheTimer.addCallBack(this.fetchTimerValue.bind(this));
        
        this.button.addEventListener(["click"], async () => {
            if(this.longPressTimeout) {
                clearTimeout(this.longPressTimeout);
                this.longPressTimeout = null;
            }
            if(!this.longPressed) { //CLICKED
                if(this.indicatorPercentage > 0) {
                    this.app.CLEAR_CACHED_MASTER_KEY();
                } else {
                    this.indicatorLoadingElement.show();
                    this.button.disable();
                    await this.app.generateMasterKeyForIndicator(this.page, this.button);
                    this.showIndicatorTimerText(true);
                    this.indicatorLoadingElement.hide();
                    this.button.enable();
                }
            }
        });

        this.button.addEventListener(["mouseup", "mouseout", "mouseleave"], () => {
            if(this.longPressTimeout) { //CANCEL LONG PRESS
                clearTimeout(this.longPressTimeout);
                this.longPressTimeout = null;
                this.longPressed = false;
            }
        });

        this.button.addEventListener(["mousedown"], (event) => {
            if (event.type === "click" && event.button !== 0) {
                return;
            }
            this.longPressed = false;
        
            if(!this.longPressTimeout) { //LONG PRESSED
                this.longPressTimeout = setTimeout(async () => {
                    this.longPressed = true;
                    this.longPressTimeout = null;

                    if(this.indicatorPercentage > 0) {
                        this.app.REFRESH_CACHED_MASTER_KEY_TIMEOUT();
                    } else {
                        this.indicatorLoadingElement.show();
                        this.button.disable();
                        await this.app.generateMasterKeyForIndicator(this.page, this.button);
                        this.showIndicatorTimerText(true);
                        this.indicatorLoadingElement.hide();
                        this.button.enable();
                    }
                }, this.LONG_PRESS_DELAY_MS);
            }
        });

        this.button.addEventListener(["mouseenter", "mouseover"], () => {
            this.showIndicatorTimerText(false);
        });

        this.button.addEventListener(["mouseleave", "mouseout"], () => {
            this.hideIndicatorTimerText(true);
        });
    }

    fetchTimerValue(time) {
        let text;
        let hoverText;
        if(time === 0) {
            text = this.NO_KEY_TEXT;
            hoverText = this.NO_KEY_TEXT;
        } else {
            let minutes = (parseInt(time / 60)).toString().padStart(2, '0');
            let seconds = (time % 60).toString().padStart(2, '0');
            text = minutes + ":" + seconds;
            hoverText = this.HELPER_TEXT;
        }
        this.indicatorTimerText.getElement().innerHTML = text;
        this.getElement().title = hoverText;
        if(time < 30) this.showIndicatorTimerText(false);
    }

    showIndicatorTimerText(withHideTimeout) {
        this._clearIndicatorTimerTextTimeout();
        this.indicatorTimerText.getElement().classList.add(this.INDICATOR_TIMER_SHOW_CLASS);
        if(withHideTimeout) {
            this.hideIndicatorTimerText(true);
        }
    }

    hideIndicatorTimerText(withTimeout) {
        this._clearIndicatorTimerTextTimeout();
        if(withTimeout) {
            this.showIndicatorTimerTextTimeout = setTimeout(() => {
                this.indicatorTimerText.getElement().classList.remove(this.INDICATOR_TIMER_SHOW_CLASS);
            }, this.HIDE_TIMER_TEXT_DELAY_MS);
        } else {
            this.indicatorTimerText.getElement().classList.remove(this.INDICATOR_TIMER_SHOW_CLASS);
        }
    }

    _clearIndicatorTimerTextTimeout() {
        if(this.showIndicatorTimerTextTimeout) {
            clearTimeout(this.showIndicatorTimerTextTimeout);
            this.showIndicatorTimerTextTimeout = null;
        }
    }

    setCacheIndicatorCallBack(time) {
        let percentage = 100 * time / this.app.CONSTANTS.PASS_CACHE_DURATION_SECS;
        this.setIndicator(percentage);
    }

    setIndicator(percentage) {
        percentage = parseInt(percentage);
        if(percentage > 100 || percentage < 0) throw new Error("Invalid percentage for indicator:" + percentage);
        this.indicatorPercentage = percentage;

        let element = this.indicatorElement.getElement();
        if(percentage === 0) {
            element.classList.add(this.INDICATOR_ZERO_CLASS);
            this.button.setIcon(this.KEY_INVALID_ICON_NAME);
        } else {
            element.classList.remove(this.INDICATOR_ZERO_CLASS);
            this.button.setIcon(this.KEY_VALID_ICON_NAME);

            let lineLength = parseInt(this.INDICATOR_ELEMENT_MAX_VALUE * (percentage / 100.0));
            let dashArray = lineLength + "," + (this.INDICATOR_ELEMENT_MAX_VALUE - lineLength);
            element.style.strokeDasharray = dashArray;
        }

    }
}

export class MainOptionsSearch extends Component {
    constructor(app, page) {
        super("id", "main-page-option-search", page, app);

        let inputLabel = "input-search"
        this.input = new TextInput(app, page, inputLabel);
        this.icon = new MaterialIcon(app, page, inputLabel, "search");
        
        this.SEARCH_PANEL_CLASSES = "p p-out p-round".split(" ");
        this.SEARCH_PLACEHOLDER_TEXT_OPTIONS = ["Search for anything...", "Search for something...", "What are you looking for?", "Type something to search...", "What do you want?", "Finding something?"];
        this.ICON_DISABLED_CLASS = "input-search-icon-disabled";
    }

    create() {
        let element = documentCreateElement("div", this.label, this.SEARCH_PANEL_CLASSES);

        let icon = this.icon.create();

        let input = this.input.create();
        
        element.appendChild(icon);
        element.appendChild(input);

        return element;
    }

    setup() {
        this.input.addEventListener(["focus"], () => {
            this._toggleSearchFocus(true);
            let searchText = this.getSearchValue();
            if(searchText) {
                this.app.searchPassManagerEntries(searchText);
            }
        });

        this.input.addEventListener(["focusout"], () => {
            this._toggleSearchFocus(false);
        });

        this.input.addEventListener(["input"], () => {
            let searchText = this.getSearchValue();
            if(searchText) {
                this.app.searchPassManagerEntries(searchText);
            }
        });
    }

    _toggleSearchFocus(focusIn) {
        this.input.getElement().placeholder = focusIn ? this._getRandomSearchPlaceholder() : "";
        if(focusIn) {
            this.icon.getElement().classList.add(this.ICON_DISABLED_CLASS);
            this.input.getElement().style.width = "250px";
            this.page.closeAllMoreInfosAndScrollToTop();
            this.page.forceEncrypt();
        } else {
            if(!this.getSearchValue()) {
                this.icon.getElement().classList.remove(this.ICON_DISABLED_CLASS);
                this.input.getElement().style.width = "150px";
                this.page.show(true);
            }
        }
    }

    reset() {
        this.input.getElement.value = "";
    }

    getSearchValue() {
        return this.input.getElement().value;
    }

    _getRandomSearchPlaceholder() {
        let ind = Math.floor(Math.random() * this.SEARCH_PLACEHOLDER_TEXT_OPTIONS.length);
        return this.SEARCH_PLACEHOLDER_TEXT_OPTIONS[ind];
    }
}

export class MainOptionsDownload extends Component {
    constructor(app, page) {
        super("id", "main-page-option-download", page, app);
        this.button = new IconButton(app, page, "main-page-option-download-button", "download", "Download file");
    }

    create() {
        let element = documentCreateElement("div", this.label);
        element.appendChild(this.button.create());

        return element;
    }

    setup() {
        this.button.addEventListener(["click"], () => {
            this.app.downloadPassFile();
        });
    }

    disable() {
        this.button.disable();
    }

    enable() {
        this.button.enable();
    }
}

class EditTextInput extends TextInput {
    constructor(app, page, field) {
        super(app, page, "edit-text-input-" + field);
    }

    setInputType(type) {
        this.inputType = type;
    }
}


class EditTextArea extends Component {
    constructor(app, page, field) {
        super("id", "edit-text-area-" + field, page, app);

        this.TEXT_AREA_CLASS = "text-area";
    }

    create() {
        let element = documentCreateElement("textarea", this.label, this.TEXT_AREA_CLASS);
        element.name = this.label;

        return element;
    }
}

export class EditView extends Component {
    constructor(app, page) {
        super("id", "edit-view", page, app);

        this.config = app.passManager.config;

        this.ACTION_TYPES = page.ACTION_TYPES;
        this.action;

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
        this.inputValidations = this.setupInputValidations();

        this.confirmButton = new IconButton(app, page, "edit-view-confirm-button", "check_circle", "Confirm");

        this.cancelButton = new IconButton(app, page, "edit-view-cancel-button", "cancel", "Cancel");

        this.EDIT_VIEW_ROW_ID_PREFIX = "edit-view-row-";
        this.EDIT_TEXT_WRAPPER_ID_PREFIX = "edit-text-wrapper-";
        this.EDIT_VIEW_CLASSES = "v hv-l vh-c".split(" ");
        this.EDIT_VIEW_ROW_CLASSES = "h hv-c vh-c edit-view-row".split(" ");
        this.EDIT_VIEW_ROW_HEADER_CLASS = "h hv-r vh-c edit-view-row-header".split(" ");
        this.EDIT_VIEW_ROW_INPUT_CLASS = "edit-view-row-input";
        this.EDIT_VIEW_FOOTER_ROW_CLASSES = "h hv-c vh-c edit-view-row".split(" ");

        this.PASSWORD_HEADER = passEntryConfig.password.value;
        this.EDIT_PASSWORD_MESSAGE = "Type to change password";
        this.SECRETS_HEADER = passEntryConfig.secrets.value;
        this.EDIT_SECRETS_MESSAGE = "Type to change secrets";
    }

    create() {
        let element = documentCreateElement("div", this.label, this.EDIT_VIEW_CLASSES);
        element.style.maxHeight = is_mobile_or_tablet_view() ? "60vh" : "600px";
        let entryConfig = this.config.EntryConfig;

        Object.entries(this.inputs).forEach(entry => {
            let field = entry[0];
            let input = entry[1];

            let row = documentCreateElement("div", this.EDIT_VIEW_ROW_ID_PREFIX + field, this.EDIT_VIEW_ROW_CLASSES);

            let rowHeader = documentCreateElement("div", null, this.EDIT_VIEW_ROW_HEADER_CLASS);

            rowHeader.innerHTML = entryConfig[field].title + ":";

            let inputElement = input.create();
            inputElement.classList.add(this.EDIT_VIEW_ROW_INPUT_CLASS);
            
            let inputElementWrapper = documentCreateElement("div", this.EDIT_TEXT_WRAPPER_ID_PREFIX + field);
            inputElementWrapper.appendChild(inputElement);

            row.appendChild(rowHeader);
            row.appendChild(inputElementWrapper);

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
        this.cancelButton.addEventListener(["click"], () => {
            this.app.goToMainPage(this.page, false);
        });

        this.confirmButton.addEventListener(["click"], () => {
            let entry = this.convertInputValuesToEditPageEntry();
            if(!this.validateValues(entry)) return;
            this.app.confirmEditPageEntry(entry, this.page);
        });
        
        this.attachInputValidationErrorTooltips();
        this.setupInputCloseTooltipListeners();
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

    setupInputValidations() {
        return {
            tag: [
                {
                    isInvalid: (tag) => {return !tag || tag.match(/^ *$/);}, 
                    errorMessage: "Entry must have a tag"
                },
                {
                    isInvalid: (tag) => {return tag.includes(" ");}, 
                    errorMessage: "Tag must not contain spaces"
                },
                {
                    isInvalid: (tag) => {return this.action === this.ACTION_TYPES.ADD && this.app.passManager.entryAlreadyExistsWithTag(tag);}, 
                    errorMessage: "Tag must be unique"
                },
                {
                    isInvalid: (tag) => {return this.action === this.ACTION_TYPES.EDIT && this.app.passManager.entryAlreadyExistsWithTag(tag, this.page.editEntry.tag);},
                    errorMessage: "Tag must be unique"
                }
            ],
            website: [
                {
                    isInvalid: (website) => {return website && !website.match(this.app.CONSTANTS.WEBSITE_REGEXP);},
                    errorMessage: "Website is invalid"
                }
            ]
        }
    }

    attachInputValidationErrorTooltips() {
        Object.entries(this.inputValidations).forEach(fieldValidation => {
            let field = fieldValidation[0];
            let validations = fieldValidation[1];

            let fieldWrapper = new Element("id", this.EDIT_TEXT_WRAPPER_ID_PREFIX + field);


            validations.forEach((validation, id) => {
                let tt = new Tooltip(this.app, this.page, "edit-error-" + field + "-" + id, validation.errorMessage, "ERROR");
                tt.createAndAlignToComponent(fieldWrapper);
                tt.setup();
                tt.hide();
                validation.tooltip = tt;
            })
        })
    }

    setupInputCloseTooltipListeners() {
        Object.entries(this.inputValidations).forEach(fieldValidation => {
            let field = fieldValidation[0];
            let validations = fieldValidation[1];

            this.inputs[field].addEventListener(['click', 'focusin', 'input'], () => {
                validations.forEach(validation => {
                    validation.tooltip.hide();
                });
            })
        })
    }

    hideValidationTooltips() {
        Object.values(this.inputValidations).forEach(validations => {
            validations.forEach(validation => {
                    validation.tooltip.hide();
            })
        })
    }

    validateValues(entry) {
        let noErrors = true; //We just want to show one invalid message
        Object.entries(this.inputValidations).forEach(fieldValidation => {
            let field = fieldValidation[0];
            let validations = fieldValidation[1];
            let inputElement = this.inputs[field].getElement();

            validations.forEach(validation => {
                if(noErrors && validation.isInvalid(entry[field])) {
                    inputElement.focus();
                    noErrors = false;
                    let topPos = inputElement.offsetTop;
                    this.getElement().scrollTop = topPos - this.getElement().offsetTop;
                    validation.tooltip.show();
                } else {
                    validation.tooltip.hide();
                }
            })
        })
        return noErrors;
    }

    populateInputs(entry) {
        let passEntryConfig = this.config.EntryConfig;

        Object.entries(entry).forEach(headerContent => {
            let header = headerContent[0];
            let content = headerContent[1];
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
        this.hideValidationTooltips();
        if(this.action === this.ACTION_TYPES.ADD) this.setupOptionalInputPlaceholdersForAdd();
    }

    setupOptionalInputPlaceholdersForAdd() {
        let passEntryConfig = this.config.EntryConfig;
        passEntryConfig.allFields.forEach(field => {
            if(passEntryConfig[field].addOptional) {
                this.inputs[field].getElement().placeholder = "Optional";
            }
        });
    }

    setAction(action) {
        this.action = action;
    }
}

export class DraggableMenu extends Component {
    constructor(app, page) {
        super("id", "draggable-menu", page, app);
        this.CLASSES = "p-round".split(" ");

        this.ORIENTATIONS = {
            HORIZONTAL: "h",
            VERTICAL: "v"
        }

        this.orientation = this.app.cacheManager.retrieveInitialValueAndStore(CacheKeys.DRAGGABLE_MENU_ORIENTATION);

        this.WRAPPER_CLASSES = (this.ORIENTATIONS[this.orientation] + " hv-c vh-c").split(" ");
        this.WRAPPER_ID = "draggable-menu-wrapper";
        this.wrapper = new Element("id", this.WRAPPER_ID);

        this.homeButton = new IconButton(app, page, "draggable-menu-home-button", "home", "Home");
        this.backButton = new IconButton(app, page, "draggable-menu-back-button", "undo", "Back");

        this.DARK_MODE_ICON = "dark_mode";
        this.LIGHT_MODE_ICON = "light_mode";
        this.modeToggleButton = new IconButton(app, page, "draggable-menu-mode-toggle-button", this.LIGHT_MODE_ICON, "Toggle light/dark");

        this.MENU_DRAGGABLE_HELP_TEXT = "Drag menu to edges to change orientation";
        this.helperTooltip = new Tooltip(this.app, this.page, this.label, this.MENU_DRAGGABLE_HELP_TEXT);
    }

    create() {
        let element = documentCreateElement("div", this.label, this.CLASSES);
        
        let wrapper = documentCreateElement("div", this.WRAPPER_ID, this.WRAPPER_CLASSES);
        
        let homeButton = this.homeButton.create();
        wrapper.appendChild(homeButton);

        let backButton = this.backButton.create();
        wrapper.appendChild(backButton);

        let modeToggleButton = this.modeToggleButton.create();
        wrapper.appendChild(modeToggleButton);
        
        element.appendChild(wrapper);
        return element;
    }

    setup() {
        this.dragElement();
        this.homeButton.disable();
        this.backButton.disable();

        this.modeToggleButton.addEventListener(['click'], () => {
            this.app.toggleLightDarkMode();
        });

        this.homeButton.addEventListener(['click'], () => {
            this.app.goToLoginPage(this.app.shownPage);
        });

        this.backButton.addEventListener(['click'], () => {
            this.app.shownPage.referringPage.show(false);
        });

        let tooltipSide = "LEFT";
        if(this.orientation === CacheKeys.DRAGGABLE_MENU_ORIENTATION.HORIZONTAL) tooltipSide = "TOP";
        this.helperTooltip.createAndAlignToComponent(this.wrapper, tooltipSide);
        this.helperTooltip.setup();
        this.helperTooltip.show();
    }

    setLightDarkModeButtonIcon() {
        if(this.app.currentColorMode === CacheKeys.COLOR_THEME.LIGHT) {
            this.modeToggleButton.setIcon(this.LIGHT_MODE_ICON);
        } else {
            this.modeToggleButton.setIcon(this.DARK_MODE_ICON);
        }
    }

    dragElement() {
        let element = this.getElement();
        let that = this;
        let lastMouseX = 0, lastMouseY = 0;
        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();

            let offsetX = lastMouseX - e.clientX;
            let offsetY = lastMouseY - e.clientY;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;

            let newTop = element.offsetTop - offsetY;
            let newLeft = element.offsetLeft - offsetX;

            let main = that.app.main.getElement();
            let mainBoundsHeight = main.scrollHeight;
            let mainBoundsWidth = window.innerWidth;
            
            let boundedTop = Math.min(Math.max(newTop, 0), mainBoundsHeight - element.offsetHeight);
            let boundedLeft = Math.min(Math.max(newLeft, 0), mainBoundsWidth - element.offsetWidth);

            let orientation = null;
            if(boundedTop === 0) {
                orientation = CacheKeys.DRAGGABLE_MENU_ORIENTATION.HORIZONTAL;
            } else if(boundedLeft === 0) {
                orientation = CacheKeys.DRAGGABLE_MENU_ORIENTATION.VERTICAL;
            } else if(boundedTop === mainBoundsHeight - element.offsetHeight) {
                if(element.offsetTop < mainBoundsHeight - element.offsetHeight) orientation = CacheKeys.DRAGGABLE_MENU_ORIENTATION.HORIZONTAL;
            } else if(boundedLeft === mainBoundsWidth - element.offsetWidth) {
                if(element.offsetLeft < mainBoundsWidth - element.offsetWidth) orientation = CacheKeys.DRAGGABLE_MENU_ORIENTATION.VERTICAL;
            }
            that.orientation = orientation;
            if(orientation) that.changeOrientation(that.orientation);

            boundedTop = Math.min(Math.max(boundedTop, 0), mainBoundsHeight - element.offsetHeight);
            boundedLeft = Math.min(Math.max(boundedLeft, 0), mainBoundsWidth - element.offsetWidth);

            element.style.top = boundedTop + "px";
            element.style.left = boundedLeft + "px";
            element.width
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    changeOrientation(orientation) {
        if(this.app.cacheManager.retrieve(CacheKeys.DRAGGABLE_MENU_ORIENTATION) !== orientation) {
            this.helperTooltip.setText("Nice!");
            this.helperTooltip.hide();
        }

        let wrapper = this.wrapper.getElement();
        if(orientation === CacheKeys.DRAGGABLE_MENU_ORIENTATION.HORIZONTAL) {
            wrapper.classList.add(this.ORIENTATIONS.HORIZONTAL);
            wrapper.classList.remove(this.ORIENTATIONS.VERTICAL);
            this.app.cacheManager.store(CacheKeys.DRAGGABLE_MENU_ORIENTATION, orientation);
        } else if(orientation === CacheKeys.DRAGGABLE_MENU_ORIENTATION.VERTICAL) {
            wrapper.classList.remove(this.ORIENTATIONS.HORIZONTAL);
            wrapper.classList.add(this.ORIENTATIONS.VERTICAL);
            this.app.cacheManager.store(CacheKeys.DRAGGABLE_MENU_ORIENTATION, orientation);
        } else {
            throw new Error("Invalid orientation provided")
        }
    }
}