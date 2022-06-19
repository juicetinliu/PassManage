//https://www.cdnpkg.com/crypto-js/4.0.0
//https://cryptojs.gitbook.io/docs/
//https://www.youtube.com/watch?v=KQjf9get6PE
const PassEntryConfig = {
    tag:        {value: "tag",      isEncrypted: false, isArray: false}, 
    website:    {value: "website",  isEncrypted: false, isArray: false}, 
    username:   {value: "username", isEncrypted: false, isArray: false}, 
    email:      {value: "email",    isEncrypted: false, isArray: false}, 
    altEmail:   {value: "altEmail", isEncrypted: false, isArray: false}, 
    password:   {value: "password", isEncrypted: true,  isArray: false}, 
    secrets:    {value: "secrets",  isEncrypted: true,  isArray: true}, 
    hints:      {value: "hints",    isEncrypted: false, isArray: true}, 
    comments:   {value: "comments", isEncrypted: false, isArray: true},
    
    allFields: ["tag", "website", "username", "email", "altEmail", "password", "secrets", "hints", "comments"],

    forTableFields: {
        tag:      (e) => e.tag,
        website:  (e) => e.website,
        username: (e) => e.username ? e.username : e.email,
        password: (e) => e.password
    }
}

const PassConfig = {
    PassEntryValueSeparator: "[|]",
    PassEntryArraySeparator: "[*]",
    PassEntrySeparator: "\n",
    SHA256ToStringEncoding: CryptoJS.enc.Base64,
    EntryConfig: PassEntryConfig
};

class PassEntry {
    constructor(config = PassConfig) {
        this.config = config;
        this.initialize();
    }

    initialize() {
        let entryConfig = this.config.EntryConfig;
        entryConfig.allFields.forEach(field => {
            this[field] = entryConfig[field].isArray ? [] : "";
        })
    }

    export(forTableView = true) {
        let out = {};
        if(forTableView) { //just return useful entries
            Object.entries(this.config.EntryConfig.forTableFields)
                .forEach(process => {
                    out[process[0]] = process[1](this); //apply anonymous function in config
                });
        } else { //return all entries for secondary view
            this.config.EntryConfig.allFields.forEach(field => {
                out[field] = this[field];
            })
        }
        return out;
    }

    getField(field) {
        if(!this.isFieldValid(field)) throw new AppError(field + ' is an invalid PassEntry field to get', AppErrorType.INVALID_PASS_ENTRY_FIELD);
        return this[field];
    }

    addOrSaveToField(field, value) {
        if(!this.isFieldValid(field)) throw new AppError(field + ' is an invalid PassEntry field to add or save to', AppErrorType.INVALID_PASS_ENTRY_FIELD);
        if(value) {
            if(this.config.EntryConfig[field].isArray) {
                this[field].push(value);
            } else {
                this[field] = value;
            }
        }
    }

    isFieldValid(field) {
        return this.config.EntryConfig.allFields.includes(field);
    }

    toString() {
        let out = [];
        let entryConfig = this.config.EntryConfig;
        entryConfig.allFields.forEach(field => {
            out.push(
                entryConfig[field].isArray 
                ? this[field].join(this.config.PassEntryArraySeparator)
                : this[field]
            );
        })
        return out.join(this.config.PassEntryValueSeparator);
    }

    fromString(str) {
        let values = str.split(this.config.PassEntryValueSeparator);
        let entryConfig = this.config.EntryConfig;
        
        if(values.length < entryConfig.allFields.length) throw new Error("Not enough fields to reconstruct PassEntry from string");

        let out = new PassEntry();
        entryConfig.allFields.forEach((field, index) => {
            let value = values[index];
            if(entryConfig[field].isArray) {
                value.split(this.config.PassEntryArraySeparator).forEach(val => out.addOrSaveToField(field, val));
            } else {
                out.addOrSaveToField(field, value);
            }
        });
        return out;
    }
}

class PassManager {
    constructor(app, config = PassConfig) {
        this.masterPasswordHash = null;
        this.deviceSecretHash = null;

        this.fileSecret = null;
        this.deviceSecret = null;

        this.entries = [];
        this.passHandler = new AESHandler();
        this.cryptoWorker = new CryptoWorker();

        this.app = app;

        this.config = config;

        this.CACHED_MASTER_KEY = null; 
        this.CACHE_MASTER_KEY_DURATION_MS = 5 * 60 * 1000; //Temporarily stored for 5 minutes
        this.DESTROY_CACHED_MASTER_KEY_TIMEOUT = null;

        this._generateSecrets(); //will be overwritten if passFile is uploaded
    }

    CACHE_MASTER_KEY(mk) {
        this.CACHED_MASTER_KEY = mk;
        this.DESTROY_CACHED_MASTER_KEY(true);
    }

    DESTROY_CACHED_MASTER_KEY(withTimeout = false) {
        this.CLEAR_DESTROY_CACHED_MASTER_KEY_TIMEOUT();
        if(withTimeout) {
            this.DESTROY_CACHED_MASTER_KEY_TIMEOUT = setTimeout(function() {
                this.CACHED_MASTER_KEY = null;
            }.bind(this), this.CACHE_MASTER_KEY_DURATION_MS);
        } else {
            this.CACHED_MASTER_KEY = null;
        }
    }

    RESET_DESTROY_CACHED_MASTER_KEY_TIMEOUT() {
        this.CLEAR_DESTROY_CACHED_MASTER_KEY_TIMEOUT();
        this.DESTROY_CACHED_MASTER_KEY(true);
    }

    CLEAR_DESTROY_CACHED_MASTER_KEY_TIMEOUT() {
        if(this.DESTROY_CACHED_MASTER_KEY_TIMEOUT) {
            clearTimeout(this.DESTROY_CACHED_MASTER_KEY_TIMEOUT);
        }
        this.DESTROY_CACHED_MASTER_KEY_TIMEOUT = null;
    }

    saveMasterPasswordToHash(masterPassword) {
        this.masterPasswordHash = CryptoJS.SHA256(masterPassword).toString(this.config.SHA256ToStringEncoding);
    }

    _generateSecrets() {
        let set = "abcdefghijklmnopqrstuvwxyz0123456789";
        let s = "";
        for(let i = 0; i < 20; i++){
            s += set[Math.floor(Math.random() * set.length)];
        }
        let fs = CryptoJS.SHA256(s).toString(this.config.SHA256ToStringEncoding);
        let ds = CryptoJS.SHA256(fs).toString(this.config.SHA256ToStringEncoding)
        this.saveSecrets(fs, ds);
    }

    saveSecrets(fileSecret, deviceSecret) {
        this.fileSecret = fileSecret;
        this.deviceSecret = deviceSecret;
        this.deviceSecretHash = CryptoJS.SHA256(this.deviceSecret).toString(this.config.SHA256ToStringEncoding);
    }

    _generateMasterKey(retries = 0) {
        if(!this.masterPasswordHash) throw new AppError("Missing master password hash", AppErrorType.MISSING_MASTER_PASSWORD);
        if(!this.deviceSecretHash) throw new Error("Missing device secret hash");

        if(this.CACHED_MASTER_KEY) {
            return Promise.resolve(this.CACHED_MASTER_KEY);
        }
        
        if(retries > this.cryptoWorker.MAX_REQUEST_RETRY) throw new AppError("Maximum number of retry requests reached; try again later", AppErrorType.GENERATING_MASTER_KEY);
        
        let jobID = this.cryptoWorker.request(CryptoWorkerFunctions.PBKDF2, {
            masterPasswordHash: this.masterPasswordHash,
            deviceSecretHash: this.deviceSecretHash,
            keySize: 32,
            iterations: 100000
        });

        return new Promise(resolve => {
            let onmessageRun = (event) => {
                let mk = this.cryptoWorker.getResponseForID(event, jobID);
                if(mk === CryptoWorkerFunctions.NOTMYRESULT) { //retry after small delay
                    setTimeout(async () => {
                        let retrymk = await this._generateMasterKey(retries + 1);
                        this.CACHE_MASTER_KEY(retrymk);
                        resolve(retrymk);
                    }, this.cryptoWorker.REQUEST_RETRY_DELAY_MS);
                } else {
                    this.CACHE_MASTER_KEY(mk);
                    resolve(mk);
                }
            }
            this.cryptoWorker.pushToOnmessageQueue(onmessageRun);
        });
    }

    async addPassEntry(input) {
        let masterKey;
        if(input.password || input.secrets) {
            masterKey = await this._generateMasterKey();
        }
        
        let entry = new PassEntry();
        
        let entryConfig = this.config.EntryConfig;
        entryConfig.allFields.forEach(field => {
            let value = input[field];
            if(value) {
                if(entryConfig[field].isArray) {
                    if(entryConfig[field].isEncrypted) value = value.map(val => this._encryptString(val, masterKey));
                    value.forEach(val => entry.addOrSaveToField(field, val));
                } else {
                    if(entryConfig[field].isEncrypted) value = this._encryptString(value, masterKey);
                    entry.addOrSaveToField(field, value);
                }
            }
        });
        
        this.entries.push(entry);
    }

    _encryptString(str, masterKey) {
        if(!masterKey) {
            throw new Error("Missing master key");
        }
        return this.passHandler.encryptToString(str, masterKey);
    }

    _decryptString(str, masterKey) {
        if(!masterKey) {
            throw new Error("Missing master key");
        }
        return this.passHandler.decryptToString(str, masterKey);
    }

    async decryptPassEntryField(field, encryptedString) {
        let entryConfig = this.config.EntryConfig;
        if(!this.isPassEntryFieldValid(field)) throw new AppError(field + ' is an invalid PassEntry field to decrypt', AppErrorType.INVALID_PASS_ENTRY_FIELD);
        if(!entryConfig[field].isEncrypted) {
            console.log("No need to decrypt " + field);
            return encryptedString;
        }
        let masterKey = await this._generateMasterKey();
        
        let out = this._decryptString(encryptedString, masterKey);

        if(entryConfig[field].isArray) {
            console.log(out); 
            // WILL NEED TO PROCESS
        }
        return out;
    }

    getPassFileFromEntries(encrypt = false) {
        let out = new PassFile();
        out.setRawFromEntryStrings(
            this.fileSecret,
            this._entriesToString(),
            this.deviceSecret,
            encrypt,
            this.app.appToken);
        
        return out;
    }

    destroyUnhashedData() {
        this.entries.forEach(e => {
            e.destroyUnhashedData();
        })
    }

    isPassEntryFieldValid(field) {
        return this.config.EntryConfig.allFields.includes(field);
    }

    entriesFromStrings(passEntryStrings) {
        if(!Array.isArray(passEntryStrings)) throw new Error("strings should be in an Array");

        let passEntries = [];
        passEntryStrings.forEach(passEntryString => {
            passEntries.push(new PassEntry().fromString(passEntryString));
        });
        this._processEntryTags(passEntries);
        return passEntries;
    }

    setEntries(entries) {
        this.entries = entries;
    }

    getEntries() {
        return this.entries;
    }

    _entriesToString() {
        let entryStrings = [];
        this._processEntryTags(this.entries);
        this.entries.forEach(entry => {
            entryStrings.push(entry.toString());
        })
        return entryStrings.join(this.config.PassEntrySeparator);
    }

    _processEntryTags(entries) { //uniquely identify entries and fill in missing tags
        let getDuplicateTagEntryIndex = (tag) => {return this.entryAlreadyExistsWithTag(tag, true, entries)};
        let tagField = "tag";
        let appendNum = 0;
        entries.forEach((entry, index) => {
            let considerTagName;
            let thisTag = entry.getField(tagField);
            let indexOfInitialDuplicate = getDuplicateTagEntryIndex(thisTag);

            if (!thisTag) { // use placeholder tag if it doesn't exist
                considerTagName = tagField + appendNum; //Eg. tag2
                let indexOfDuplicate = getDuplicateTagEntryIndex(considerTagName);
                while(indexOfDuplicate >= 0 && indexOfDuplicate != index) { 
                    appendNum += 1;
                    considerTagName = tagField + appendNum;
                    indexOfDuplicate = getDuplicateTagEntryIndex(considerTagName);
                }
                entry.addOrSaveToField(tagField, considerTagName);
            } else if (indexOfInitialDuplicate >= 0 && indexOfInitialDuplicate != index) {
                let appendNewNum = 0;
                considerTagName = thisTag + appendNewNum;
                let indexOfDuplicate = getDuplicateTagEntryIndex(considerTagName);
                while(indexOfDuplicate >= 0 && indexOfDuplicate != index) { 
                    appendNewNum += 1;
                    considerTagName = thisTag + appendNewNum;
                    indexOfDuplicate = getDuplicateTagEntryIndex(considerTagName);
                }
                entry.addOrSaveToField(tagField, considerTagName);
            }
        });
    }

    entryAlreadyExistsWithTag(tag, returnIndex = false, entries = this.entries) {
        if(returnIndex) {
            return entries.findIndex(e => {
                return e.tag === tag;
            })
        } else {
            let other = entries.find(e => {
                return e.tag === tag;
            })
            return other ? true : false;
        }
    }

    close() {
        this.cryptoWorker.terminate();
    }
}

class PassHandler {
    constructor() {}

    encryptToString(stringToEncrypt, key) {
        return "";
    }
    
    decryptToString(encryptedString, key) {
        return ""
    }
}

class AESHandler extends PassHandler {
    constructor() {
        super();
    }

    encryptToString(stringToEncrypt, key, encoding = null) {
        return this._hashToString(CryptoJS.AES.encrypt(stringToEncrypt, key), encoding);
    }

    decryptToString(encryptedString, key, encoding = CryptoJS.enc.Utf8) {
        return this._hashToString(CryptoJS.AES.decrypt(encryptedString, key), encoding);
    }

    _hashToString(hash, encoder) {
        return hash.toString(encoder)
    }
}

class PassFile { //encrypt/decrypt with appToken
    constructor(raw = "", config = PassConfig) {
        this.config = config;
        this.passHandler = new AESHandler();

        this.raw = raw;
        this._rawOriginal = raw; //untouched

        this.first = null;
        this.last = null;
        this.rawEntries = null;

        this.encrypted = true;

        try{ //only processing if unencrypted
            this.processFile();
        } catch(e) {
            // console.log("Something went wrong just processing this Passfile. Maybe try decrypting it?");
        }
    }

    getFirst() {
        return this.first;
    }

    getLast() {
        return this.last;
    }

    getRawEntries() {
        return this.rawEntries;
    }
    
    getRaw() {
        return this.raw;
    }

    setRawFromEntryStrings(fileSecret, entryStrings, deviceSecret, encrypt = false, appToken) {
        this.rawEntries = entryStrings;
        this.first = fileSecret;
        this.last = deviceSecret;

        if(entryStrings.length) {
            this.raw = [this.first, this.rawEntries, this.last].join(this.config.PassEntrySeparator);
        } else {
            this.raw = [this.first, this.last].join(this.config.PassEntrySeparator);
        }

        if(encrypt) {
            this.raw = this._encryptFile(appToken);
        }
        this.encrypted = encrypt;
    }

    decryptFileAndProcess(key) {
        if(!key) throw new Error("key needed to decrypt this PassFile");

        this.raw = this.passHandler.decryptToString(this.raw, key);

        this.processFile();
    }

    processFile() {
        let fsplit = this.raw.split(this.config.PassEntrySeparator);
        if(fsplit.length < 2) throw new Error("PassFile needs at least 2 lines");
        
        this.first = fsplit.shift();
        this.last = fsplit.pop();
        this.rawEntries = fsplit;

        if(this.verify()){
            this.encrypted = false;
            return true;
        } else {
            this._reset();
            throw new Error("Something went wrong with verifying this PassFile");
        }
    }

    _encryptFile(key) {
        if(!key) throw new Error("key needed to encrypt this PassFile");

        return this.passHandler.encryptToString(this.raw, key);
    }

    isEncrypted() {
        return this.encrypted;
    }

    verify() {
        return this.last === CryptoJS.SHA256(this.first).toString(this.config.SHA256ToStringEncoding);
    }

    _reset() {
        this.first = null;
        this.last = null;
        this.rawEntries = null;
        this.raw = this._rawOriginal;
        this.encrypted = true;
    }
}

function runTestCases(){
    let testPassEntryString = "Fb[|]website[|][|]something[|]hehe[|]ok[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here";
    let testPassEntryString1 = "[|]web[|][|]something[|]hehe[|]ok[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here";
    let testPassEntryString2 = "tag0[|]web[|][|]something[|]hehe[|]ok[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here";

    let testPassEntry = new PassEntry();

    if(testPassEntry.fromString(testPassEntryString).toString() !== testPassEntryString) throw new Error ("Something is wrong with PassEntry string conversion");

    let testPassManager = new PassManager();

    testPassManager.entries = testPassManager.entriesFromStrings([testPassEntryString]);
    if(testPassManager._entriesToString() !== testPassEntryString) throw new Error ("Something is wrong with PassManager string conversion");

    testPassManager.entries = testPassManager.entriesFromStrings([testPassEntryString1]);
    if(testPassManager._entriesToString() !== testPassEntryString2) throw new Error ("Something is wrong with PassManager string conversion – uniquelyIdentifyEntries");

    console.log("All tests passed");

    testPassManager.close();
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}