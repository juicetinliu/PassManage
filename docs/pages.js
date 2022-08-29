import { Element, EditView, MainOptionsDownload, MainOptionsKeyIndicator, MainOptionsSearch, MainTable, IconButton, Tooltip } from "./components.js";

class Page { 
    constructor(elementId, app) {
        this.pageElement = new Element("id", elementId);
        this.app = app;
        this.components = {};

        this.referringPage = null; //page that resulted in this one opening

        this.created = false;
    }

    show() {
        if(!this.created) this.create();
        this.app.hideAllPages();
        this.pageElement.show();
        this.app.shownPage = this;

        if(!this.app.shownPage.referringPage) {
            this.app.disableDraggableMenuBackButton();
        } else {
            this.app.enableDraggableMenuBackButton();
        }
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

export class IntroPage extends Page {
    constructor(app) {
        super("intro-page", app);
    
        this.startNewButton = new Element("id", "intro-start-new-content");
        this.fromFileButton = new Element("id", "intro-from-file-content");
    }

    setup() {
        this.startNewButton.addEventListener(["click"], async () => {
            this.app.keyCreated = false;
            await this.app.RESET_PASS_MANAGER();
            this.app.goToMainPage(this);
        });

        this.fromFileButton.addEventListener(["click"], () => {
            this.app.keyCreated = true;
            this.app.goToDropPage(this);
        });

        this.startNewButton.addEventListener(["keydown"], (event) => {
            if(event.key === 'Space' || event.keyCode === 32 || event.key === 'Enter' || event.keyCode === 13){
                this.startNewButton.getElement().click();
            }
        });

        this.fromFileButton.addEventListener(["keydown"], (event) => {
            if(event.key === 'Space' || event.keyCode === 32 || event.key === 'Enter' || event.keyCode === 13){
                this.fromFileButton.getElement().click();
            }
        });
    }

    show() {
        super.show();
    }
}

export class EditPage extends Page {
    constructor(app) {
        super("edit-page", app);

        this.config = app.passManager.config;

        this.ACTION_TYPES = {
            ADD: "add",
            EDIT: "edit"
        }

        this.editContent = new Element("id", "edit-content");

        this.components = {
            editView: new EditView(app, this)
        }

        this.editEntry = null;

        this.action = this.ACTION_TYPES.ADD; //ADD or EDIT
    }
    
    setup() {
        super.setup();
    }

    setAction(action) {
        if(action === this.ACTION_TYPES.ADD) {
            this.action = this.ACTION_TYPES.ADD;
        } else if (action === this.ACTION_TYPES.EDIT) {
            this.action = this.ACTION_TYPES.EDIT;
        } else {
            debugLog("invalid action " + action + "; defaulting to ADD");
            this.action = this.ACTION_TYPES.ADD;
        }
        this.components.editView.setAction(this.action);
    }

    setEditObject(editEntry) {
        this.editEntry = editEntry;
    }

    show(update = true) {
        if(update) {
            this.reset();
            if(this.action === this.ACTION_TYPES.EDIT && this.editEntry) {
                this.components.editView.populateInputs(this.editEntry);
            }
        }
        super.show()
    }

    reset() {
        this.components.editView.reset();
    }

    create() {
        super.create();
        let view = this.components.editView.create();
        this.editContent.appendChild(view);
    }

    confirmEditEntry(entry) {
        if(this.action === this.ACTION_TYPES.ADD) {
            this.app.addPassEntry(entry, this);
        } else if (this.action === this.ACTION_TYPES.EDIT) {
            let diff = this._processEditEntry(entry);
            let changeTag = this.editEntry.tag;
            this.app.editPassEntry(changeTag, diff, this);
        } else {
            throw new Error("Shouldn't reach this in confirmEntry()")
        }
    }

    completeEditEntry() {
        this.editEntry = null;
    }

    _processEditEntry(entry) { //remove unchanged fields
        let passEntryConfig = this.config.EntryConfig;
        let out = {};
        Object.entries(this.editEntry).forEach(entryField => {
            let header = entryField[0];
            let content = entryField[1];
            let newContent = entry[header];

            if(passEntryConfig[header].isEncrypted) {
                if(newContent) out[header] = newContent;
            } else {
                if(content !== newContent) {
                    if(passEntryConfig[header].isArray) {
                        if(content !== [] || newContent !== undefined) { //ignore if empty => empty
                            out[header] = newContent ? newContent : [];
                        }
                    } else {
                        if(content !== "" || newContent !== undefined) { //ignore if empty => empty
                            out[header] = newContent ? newContent : "";
                        }
                    }
                }
            }
        });
        return out;
    }
}

export class MainPage extends Page {
    constructor(app) {
        super("main-page", app);

        this.mainContent = new Element("id", "main-content");

        this.mainOptionsBar = new Element("id", "main-page-options");

        this.components = {
            mainSearchInput: new MainOptionsSearch(app, this),
            mainKeyIndicator: new MainOptionsKeyIndicator(app, this),
            mainDownloadButton: new MainOptionsDownload(app, this),
            mainTable: new MainTable(app, this)
        }

    }

    setup() {
        super.setup();
        let mainContent = this.mainContent.getElement();
        
        mainContent.style.width = is_mobile_or_tablet_view() ? "60vw" : "800px";
    }

    show(update) {
        super.show();
        if(update) this.updateMainTableEntries(this.app.getPassManagerEntries());
        this.mainOptionsBar.show();
        this.components.mainKeyIndicator.showIndicatorTimerText(true);
    }

    hide() {
        this.mainOptionsBar.hide();
        super.hide();
    }

    create() {
        super.create();

        this._createOptionsBar();
        this._createMainTable();
    }

    reset() {
        this.updateMainTableEntries([]);
        this.components.mainSearchInput.reset();
    }

    _createOptionsBar() {
        let search = this.components.mainSearchInput.create();
        let download = this.components.mainDownloadButton.create();
        let keyIndicator = this.components.mainKeyIndicator.create();
        
        this.mainOptionsBar.appendChild(search);
        this.mainOptionsBar.appendChild(keyIndicator);
        this.mainOptionsBar.appendChild(download);
    }

    _createMainTable(entries = []) {
        let table = this.components.mainTable.create(entries);

        this.mainContent.appendChild(table);
    }

    updateMainTableEntries(entries) {
        this.components.mainTable.updateEntries(entries);
    }

    closeAllMoreInfosAndScrollToTop() {
        this.components.mainTable.closeAllMoreInfos();
        this.components.mainTable.scrollToEntryContentTop();
    }

    forceEncrypt() {
        this.components.mainTable.forceEncrypt();
    }
}

export class LoginPage extends Page {
    constructor(app) {
        super("login-page", app);

        this.loginContent = new Element("id", "login-content");

        this.INPUT_LOGIN_WRAPPER_ID_PREFIX = "input-login-wrapper-";
        this.inputs = {
            email: new Element("id", "input-login-email"),
            password: new Element("id", "input-login-password")
        }

        this.submitCreateButton = new Element("id", "create-account-submit-button");
        this.submitLoginButton = new Element("id", "login-account-submit-button");

        this.loginOptionsContent = new Element("id", "login-options-buttons-content");

        this.loginSkipContent = new Element("id", "login-page-skip-content");
        this.loginSkipContentButton = new Element("id", "login-page-skip-button");

        this.loggedInContent = new Element("id", "login-logged-in-content");
        this.submitLogoutButton = new Element("id", "logout-account-submit-button");

        this.inputValidations = this.setupInputValidations();
        this.firebaseLoginErrorTooltips = this.createAndAttachFirebaseLoginErrorTooltips();
    }

    setup() {
        super.setup();

        this.inputs.email.addEventListener(["keyup"], (event) => {
            if(event.key === 'Enter' || event.keyCode === 13){
                this.inputs.password.getElement().focus();
            }
        });

        this.inputs.password.addEventListener(["keyup"], (event) => {
            if(event.key === 'Enter' || event.keyCode === 13){
                this.submitLoginButton.getElement().click();
            }
        });

        this.submitLoginButton.addEventListener(["click"], async () => {
            let emailInput = this.inputs.email.getElement();
            let email = emailInput.value;
            let password = this.inputs.password.getElement().value;
            if(!this.validateValues()) return;

            this.hide();
            try {
                await this.app.signInFireAccount(email, password);
            } catch (error) {
                this.handleFireActionErrorWithTooltips(error, "login");
            }
        });

        this.submitCreateButton.addEventListener(["click"], async () => {
            let emailInputElement = this.inputs.email.getElement();
            let email = emailInputElement.value;
            let password = this.inputs.password.getElement().value;
            if(!this.validateValues()) return;

            this.hide();
            try {
                await this.app.createNewFireAccount(email, password);
            } catch (error) {
                this.handleFireActionErrorWithTooltips(error, "create");
            }
        });

        this.loginSkipContentButton.addEventListener(["click"], async () => {
            await this.app.signOutFireAccount();
            this.app.goToIntroPage(this);
        });

        this.submitLogoutButton.addEventListener(["click"], async () => {
            await this.app.signOutFireAccount();
            this.app.goToLoginPage(this);
        });

        this.attachInputValidationErrorTooltips();
        this.setupInputCloseTooltipListeners();
    }

    handleFireActionErrorWithTooltips(error, action) {
        this.hideAllFirebaseLoginErrorTooltips();
        if(error instanceof AppError) {
            let errorTooltip = this.firebaseLoginErrorTooltips[error.type];
            if(errorTooltip) {
                errorTooltip.show();
            } else {
                throw new Error("Shouldn't reach this in " + action + " account");
            }
        } else {
            throw new Error("Shouldn't reach this in " + action + " account");
        }
    }

    create() {
        super.create();
        this.loginOptionsContent.hide();
    }

    show() {
        super.show();
        this.loginSkipContent.show();
        this.app.disableDraggableMenuHomeButton();

        if(this.app.isFireLoggedIn()) {
            this.loggedInContent.show();
            this.loginContent.hide();
        } else {
            this.loginContent.show();
            this.loggedInContent.hide();
        }
    }

    hide() {
        super.hide();
        this.loginSkipContent.hide();
        this.hideTooltips();
        this.app.enableDraggableMenuHomeButton();
    }

    clearPasswordInput() {
        this.inputs.password.getElement().value = "";
    }

    setupInputValidations() {
        return {
            email: [
                {
                    isInvalid: (email) => {return !email || !email.length;}, 
                    errorMessage: "Please provide an email"
                },
                {
                    isInvalid: (email, element) => {return (typeof element.checkValidity === 'function' ? !element.checkValidity() : !/\S+@\S+\.\S+/.test(email));}, 
                    errorMessage: "Email is invalid"
                }
            ],
            password: [
                {
                    isInvalid: (password) => {return !password || !password.length;},
                    errorMessage: "Please provide a password"
                },
                {
                    isInvalid: (password) => {return password.length < 8},
                    errorMessage: "Password should have at least 8 characters"
                }
            ]
        }
    }

    setupFirebaseLoginErrorTooltips() {
        return {
            email: {
                "user-not-found": {
                    appError: AppErrorType.FIRE.SIGN_IN_ERROR.USER_NOT_FOUND,
                    errorMessage: "Email not found",
                },
                "email-in-use": {
                    appError: AppErrorType.FIRE.CREATE_ACCOUNT_ERROR.EMAIL_IN_USE,
                    errorMessage: "Email already in use",
                },
                "invalid-email": {
                    appError: AppErrorType.FIRE.INVALID_EMAIL,
                    errorMessage: "Email is invalid",
                },
            },
            password: {
                "incorrect-password": {
                    appError: AppErrorType.FIRE.SIGN_IN_ERROR.WRONG_PASSWORD,
                    errorMessage: "Password is incorrect",
                },
                "password-weak": {
                    appError: AppErrorType.FIRE.CREATE_ACCOUNT_ERROR.WEAK_PASSWORD,
                    errorMessage: "Password is weak",
                },
                "something-wrong-create": {
                    appError: AppErrorType.FIRE.CREATE_ACCOUNT_ERROR.GENERAL,
                    errorMessage: "Something went wrong creating this account"
                },
                "something-wrong-login": {
                    appError: AppErrorType.FIRE.SIGN_IN_ERROR.GENERAL,
                    errorMessage: "Something went wrong logging in this account"
                },
                "too-many-requests": {
                    appError: AppErrorType.FIRE.SIGN_IN_ERROR.TOO_MANY_REQUESTS,
                    errorMessage: "Too many incorrect login attempts, try again later"
                },
            }
        }
    }

    createAndAttachFirebaseLoginErrorTooltips() {
        let tooltips = {};
        Object.entries(this.setupFirebaseLoginErrorTooltips()).forEach(fieldErrors => {
            let field = fieldErrors[0];
            let errors = fieldErrors[1];

            let inputWrapper = new Element("id", this.INPUT_LOGIN_WRAPPER_ID_PREFIX + field);

            Object.entries(errors).forEach(idError => {
                let id = idError[0];
                let error = idError[1];
                
                let tt = new Tooltip(this.app, this, "login-fire-error-" + field + "-" + id, error.errorMessage, "ERROR");
                tt.createAndAlignToComponent(inputWrapper, "TOP");
                tt.setup();
                tt.hide();
                tooltips[error.appError] = tt;
            })
        })

        return tooltips;
    }

    hideAllFirebaseLoginErrorTooltips() {
        Object.values(this.firebaseLoginErrorTooltips).forEach(tooltip => {
            tooltip.hide();
        });
    }

    attachInputValidationErrorTooltips() {
        Object.entries(this.inputValidations).forEach(fieldValidation => {
            let field = fieldValidation[0];
            let validations = fieldValidation[1];

            let inputWrapper = new Element("id", this.INPUT_LOGIN_WRAPPER_ID_PREFIX + field);

            validations.forEach((validation, id) => {
                let tt = new Tooltip(this.app, this, "login-error-" + field + "-" + id, validation.errorMessage, "ERROR");
                tt.createAndAlignToComponent(inputWrapper, "TOP");
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
                this.hideAllFirebaseLoginErrorTooltips();                
            })
        });
    }

    hideTooltips() {
        Object.values(this.inputValidations).forEach(validations => {
            validations.forEach(validation => {
                    validation.tooltip.hide();
            })
        })
        this.hideAllFirebaseLoginErrorTooltips();                
    }


    validateValues() {
        let noErrors = true; //We just want to show one invalid message
        Object.entries(this.inputValidations).forEach(fieldValidation => {
            let field = fieldValidation[0];
            let validations = fieldValidation[1];
            let inputElement = this.inputs[field].getElement();

            validations.forEach(validation => {
                if(noErrors && validation.isInvalid(inputElement.value, inputElement)) {
                    inputElement.focus();
                    noErrors = false;
                    validation.tooltip.show();
                } else {
                    validation.tooltip.hide();
                }
            })
        })
        return noErrors;
    }
}

export class KeyPage extends Page {
    constructor(app) {
        super("key-page", app);

        this.keyContent = new Element("id", "key-content");

        this.keySkipContent = new Element("id", "key-page-skip-content");
        this.keySkipContentButton = new Element("id", "key-page-skip-button");
        this.KEY_CANCEL_TEXT = "Cancel";
        this.KEY_SKIP_TEXT = "Skip";

        this.inputKey = new Element("id", "input-key");
        
        
        this.submitUserKeyButton = new IconButton(app, this, "submit-user-key-button", "arrow_forward");

        this.callBackAfterKeyEntered = null;
        this.KEY_INPUT_PLACEHOLDER = "Enter your key 🔑";
        this.KEY_INPUT_CREATE_PLACEHOLDER = "Create your key 🔑";
    }

    setCallBackAfterKeyEntered(callBack) {
        this.callBackAfterKeyEntered = callBack;
    }

    setup() {
        super.setup();
        this.inputKey.getElement().placeholder = this.KEY_INPUT_PLACEHOLDER;
        this.inputKey.addEventListener(["input"], () => {
            this.toggleSubmitButton();
        });
        
        this.submitUserKeyButton.addEventListener(["click"], () => {
            let pw = this.inputKey.getElement().value;
            this.validatePassword(pw);
            this._clearKeyInput();
            this._savePasswordToApp(pw);
            this.callBackAfterKeyEntered = null;
        });

        // https://stackoverflow.com/questions/7060750/detect-the-enter-key-in-a-text-input-field
        this.inputKey.addEventListener(["keyup"], (event) => {
            if(event.key === 'Enter' || event.keyCode === 13){
                this.submitUserKeyButton.getElement().click();
            }
        });

        this.keySkipContentButton.addEventListener(["click"], () => {
            this._clearKeyInput();
            if(!this.callBackAfterKeyEntered) {//If there is no callBack then we must be entering key page from fileDrop – make sure to direct to main view
                this.app.goToMainPage(this);
            } else {//Otherwise callBack must be from a referring page – we allow a cancel to bring user back to referring page
                //We make sure not to update the referring page to keep its previous state
                this.referringPage.show(false);
            }
        });

        this.keySkipContentButton.addEventListener(["keydown"], (event) => {
            if(event.key === 'Space' || event.keyCode === 32 || event.key === 'Enter' || event.keyCode === 13){
                this.keySkipContentButton.getElement().click();
            }
        });
    }

    _clearKeyInput() {
        this.inputKey.getElement().value = "";
    }

    reset() {
        this._clearKeyInput();
    }

    create() {
        super.create();
        let button = this.submitUserKeyButton.create();
        this.keyContent.appendChild(button);
    }

    hide() {
        super.hide();
        this.keySkipContent.hide();
    }

    show() {
        super.show();
        this.inputKey.getElement().placeholder = this.app.keyCreated ? this.KEY_INPUT_PLACEHOLDER : this.KEY_INPUT_CREATE_PLACEHOLDER;

        this.inputKey.getElement().focus();
        this.submitUserKeyButton.disable();
        if(!this.callBackAfterKeyEntered) { //If there is no callBack then we must be entering key page from fileDrop - we allow a skip straight to main view
            this.keySkipContentButton.getElement().innerHTML = this.KEY_SKIP_TEXT;
            this.keySkipContent.show();
        } else { //Otherwise callBack must be from a referring page – we allow a cancel to bring user back to referring page 
            this.keySkipContentButton.getElement().innerHTML = this.KEY_CANCEL_TEXT;
            this.keySkipContent.show();
        }
        this.toggleSubmitButton();
    }

    toggleSubmitButton() {
        if(this.inputKey.getElement().value) {
            this.submitUserKeyButton.enable();
        }else{
            this.submitUserKeyButton.disable();
        }
    }

    _savePasswordToApp(p) {
        this.app.savePasswordToPassManager(p, this, this.callBackAfterKeyEntered);
    }

    validatePassword(password) {
        if(!password) throw new AppError("Password must not be empty", AppErrorType.INVALID_MASTER_PASSWORD);
    }
}

export class DropPage extends Page {
    constructor(app) {
        super("drop-page", app);

        this.inputKeyFile = new Element("id", "input-password-file");
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
        this.dropZone.addEventListener(["drop"], (event) => {
            this._setDropPanelClass(true);
            this._dropZoneDropHandler(event);
        });

        this.dropZone.addEventListener(["dragenter"], (event) => {
            this._setDropPanelClass(false, true);
            this._dropZoneDragOverHandler(event);
        });
                    
        this.inputKeyFile.addEventListener(["change"], (event) => {
            let files = event.target.files;

            if (!files.length || files.length > 1) { //only 1 file allowed
                return;
            }

            this.app.setRawPassFile(files[0]);
            this.inputKeyFile.getElement().value = ""; //clear stored file after uploading
            this._confirmRawPassFile();
        });

        this.inputKeyFile.addEventListener(["mousedown", "focus", "focusin"], () => {
            this._setDropPanelClass(true);
        });

        this.inputKeyFile.addEventListener(["mouseover", "mousein"], () => {
            this._setDropPanelClass(false, true);
        });

        this.inputKeyFile.addEventListener(["mouseup", "mouseout", "focusout", "dragleave"], () => {
            this._setDropPanelClass(false);
        });

        this.cancelPassFileButton.addEventListener(["click"], () => {
            this._appDeleteRawPassFile();
            this.show();
        });

        this.confirmPasswordFileErrorButton.addEventListener(["click"], () => {
            this._appDeleteRawPassFile();
            this.show();
        });

        this.confirmPassFileButton.addEventListener(["click"], () => {
            this._appExtractRawPassFile(this);
        });
    }

    show(update, fileDrop = true) {
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
        this.show(true, false);

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