//https://www.cdnpkg.com/crypto-js/4.0.0
//https://cryptojs.gitbook.io/docs/
//https://www.youtube.com/watch?v=KQjf9get6PE
const PassEntryConfig = {
    tag: {isEncrypted: false, isArray: false}, 
    website: {isEncrypted: false, isArray: false}, 
    username: {isEncrypted: false, isArray: false}, 
    email: {isEncrypted: false, isArray: false}, 
    altEmail: {isEncrypted: false, isArray: false}, 
    password: {isEncrypted: true, isArray: false}, 
    secrets: {isEncrypted: true, isArray: true}, 
    hints: {isEncrypted: false, isArray: true}, 
    comments: {isEncrypted: false, isArray: true},
    fields: ["tag", "website", "username", "email", "altEmail", "password", "secrets", "hints", "comments"]
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
        this.tag = ""; //Unique identifier like website or name
        this.website = "";
        this.username = "";
        this.email = "";
        this.altEmail = "";
        this.password = ""; //hashed
        this.secrets = []; //hashed
        this.hints = [];
        this.comments = [];

        this.unhashedPassword = "";
        this.unhashedHints = [];

        this.config = config;
    }

    export(forTableView = true) {
        if(forTableView) { //just return useful entries
            return {
                tag: this.tag,
                website: this.website, 
                username: this.username ? this.username : this.email,
                password: this.password
            };
        } else { //return all entries for secondary view
            return {
                tag: this.tag, 
                website: this.website, 
                username: this.username, 
                email: this.email, 
                altEmail: this.altEmail, 
                password: this.password, 
                secrets: this.secrets, 
                hints: this.hints, 
                comments: this.comments
            };
        }
    }

    setTag(tag) {
        if(tag) {
            this.tag = tag;
        }
    }

    getTag() {
        return this.tag;
    }

    setWebsite(website) {
        if(website) {
            this.website = website;
        }
    }

    setUsername(username) {
        if(username) {
            this.username = username;
        }
    }

    setEmail(email) {
        if(email) {
            this.email = email;
        }
    }

    setAltEmail(altEmail) {
        if(altEmail) {
            this.altEmail = altEmail;
        }
    }
    
    setPassword(password) {
        if(password) {
            this.password = password;
        }
    }

    addToSecrets(secret) {
        if(secret) {
            this.secrets.push(secret);
        }
    }

    addToHints(hint) {
        if(hint) {
            this.hints.push(hint);
        }
    }

    addToComments(comment) {
        if(comment) {
            this.comments.push(comment);
        }
    }

    toString() {
        let out = [
            this.tag,
            this.website,
            this.username,
            this.email,
            this.altEmail,
            this.password,
            this.secrets.join(this.config.PassEntryArraySeparator),
            this.hints.join(this.config.PassEntryArraySeparator),
            this.comments.join(this.config.PassEntryArraySeparator)
        ];
        return out.join(this.config.PassEntryValueSeparator);
    }

    fromString(str) {
        let values = str.split(this.config.PassEntryValueSeparator);
        
        if(values.length != 9) throw new Error("Not enough fields to reconstruct PassEntry from string");

        let out = new PassEntry();
        out.setTag(values[0]);
        out.setWebsite(values[1]);
        out.setUsername(values[2]);
        out.setEmail(values[3]);
        out.setAltEmail(values[4]);
        out.setPassword(values[5]);
        values[6].split(this.config.PassEntryArraySeparator).forEach(val => out.addToSecrets(val));
        values[7].split(this.config.PassEntryArraySeparator).forEach(val => out.addToHints(val));
        values[8].split(this.config.PassEntryArraySeparator).forEach(val => out.addToComments(val));

        return out;
    }

    destroyUnhashedData() {
        this.unhashedPassword = "";
        this.unhashedHints = [];
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

        this.CACHED_MASTER_KEY = null; //Temporarily stored for 5 minutes
        this.CACHE_MASTER_KEY_DURATION_MS = 5 * 60 * 1000; 
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

    _generateMasterKey() {
        if(!this.masterPasswordHash) throw new AppError("Missing master password hash", AppErrorType.MISSING_MASTER_PASSWORD);
        if(!this.deviceSecretHash) throw new Error("Missing device secret hash");

        if(this.CACHED_MASTER_KEY) {
            return Promise.resolve(this.CACHED_MASTER_KEY);
        }

        this.cryptoWorker.request(CryptoWorkerFunctions.PBKDF2, {
            masterPasswordHash: this.masterPasswordHash,
            deviceSecretHash: this.deviceSecretHash,
            keySize: 32,
            iterations: 100000
        });

        return new Promise(resolve => {
            this.cryptoWorker.onmessage = function (event) {
                let mk = this.cryptoWorker.getResponse(event);
                this.CACHE_MASTER_KEY(mk);
                resolve(mk);
            }.bind(this);
        });
    }

    async addPassEntry(input) {
        let masterKey;
        if(input.password || input.secrets) {
            masterKey = await this._generateMasterKey();
        }
        
        let entry = new PassEntry();
        if(input.tag) entry.setTag(input.tag);
        if(input.website) entry.setWebsite(input.website);
        if(input.username) entry.setUsername(input.username);
        if(input.email) entry.setEmail(input.email);
        if(input.altEmail) entry.setAltEmail(input.altEmail);
        if(input.password) entry.setPassword(this._encryptString(input.password, masterKey)); //hashed
        if(Array.isArray(input.secrets)) input.secrets.forEach(val => entry.addToSecrets(this._encryptString(val, masterKey))); //hashed
        if(Array.isArray(input.hints)) input.hints.forEach(val => entry.addToHints(val));
        if(Array.isArray(input.comments)) input.comments.forEach(val => entry.addToComments(val));
        
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

    async decryptPassEntryField(encryptedString, field) {
        let entryConfig = this.config.EntryConfig;
        if(!entryConfig.fields.includes(field)) throw new Error(field + ' is an invalid PassEntry field');
        if(!entryConfig[field].isEncrypted) {
            console.log("No need to decrypt " + field);
            return encryptedString;
        }
        let masterKey = await this._generateMasterKey();
        
        let out = this._decryptString(encryptedString, masterKey);

        if(entryConfig[field].isArray) {
            console.log(out); 
            // WILL NEED TO SPLIT
        }
        return out;
    }

    getPassFile(encrypt = false) {
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

    entriesFromStrings(passEntryStrings) {
        if(!Array.isArray(passEntryStrings)) throw new Error("strings should be in an Array");

        let passEntries = [];
        passEntryStrings.forEach(passEntryString => {
            passEntries.push(new PassEntry().fromString(passEntryString));
        });

        return passEntries;
    }

    setEntries(entries) {
        this.entries = entries;
    }

    getEntries() {
        return this.entries;
    }

    _entriesToString() {
        this._uniquelyIdentifyEntries();
        let entryStrings = [];
        this.entries.forEach(entry => {
            entryStrings.push(entry.toString());
        })

        return entryStrings.join(this.config.PassEntrySeparator);
    }

    _uniquelyIdentifyEntries() {
        this.entries.forEach((entry, index) => {
            if (!entry.getTag()) {
                entry.setTag("Tag" + index);
            }
        });
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
    let testPassEntryString2 = "Tag0[|]web[|][|]something[|]hehe[|]ok[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here";

    let testPassEntry = new PassEntry();

    if(testPassEntry.fromString(testPassEntryString).toString() !== testPassEntryString) throw new Error ("Something is wrong with PassEntry string conversion");

    let testPassManager = new PassManager();

    testPassManager.entries = testPassManager.entriesFromStrings([testPassEntryString]);
    if(testPassManager._entriesToString() !== testPassEntryString) throw new Error ("Something is wrong with PassManager string conversion");

    testPassManager.entries = testPassManager.entriesFromStrings([testPassEntryString1]);
    if(testPassManager._entriesToString() !== testPassEntryString2) throw new Error ("Something is wrong with PassManager string conversion – uniquelyIdentifyEntries");

    console.log("All tests passed");
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}