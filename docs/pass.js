//https://www.cdnpkg.com/crypto-js/4.0.0
//https://cryptojs.gitbook.io/docs/

const PassConfig = {
    PassEntryValueSeparator: "[|]",
    PassEntryArraySeparator: "[*]",
    PassEntrySeparator: "\n"
};

class PassEntry {
    constructor(config = PassConfig) {
        this.tag = ""; //Unique identifier like website or name
        this.username = "";
        this.email = "";
        this.altEmail = "";
        this.password = ""; //hashed
        this.secrets = []; //hashed
        this.hints = [];
        this.comments = [];

        this.config = config;
    }

    setTag(tag) {
        if(tag) {
            this.tag = tag;
        }
    }

    getTag() {
        return this.tag;
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
        
        if(values.length != 8) throw new Error('Not enough fields to reconstruct PassEntry from string');

        let out = new PassEntry();
        out.setTag(values[0]);
        out.setUsername(values[1]);
        out.setEmail(values[2]);
        out.setAltEmail(values[3]);
        out.setPassword(values[4]);
        values[5].split(this.config.PassEntryArraySeparator).forEach(val => out.addToSecrets(val));
        values[6].split(this.config.PassEntryArraySeparator).forEach(val => out.addToHints(val));
        values[7].split(this.config.PassEntryArraySeparator).forEach(val => out.addToComments(val));

        return out;
    }
}

class PassManager {
    constructor(config = PassConfig) {
        this.encoding = CryptoJS.enc.Base64;
        this.masterPasswordHash = null;
        this.saltyHash = null; 
        this.entries = [];
        this.passHandler = new AESHandler();
        
        this.config = config;
    }

    saveMasterPasswordToHash(masterPassword) {
        this.masterPasswordHash = CryptoJS.SHA256(masterPassword).toString(this.encoding);
    }

    saveUsernametoSaltyHash(username) {
        this.saltyHash = CryptoJS.SHA256(username + this._generateSecretHash()).toString(this.encoding);
    }
    
    _generateSecretHash() {
        return "secretHash";
    }

    _generateMasterKey() {
        if(!this.masterPasswordHash) throw new Error('Missing master password hash');
        if(!this.saltyHash) throw new Error('Missing salty hash');

        return CryptoJS.PBKDF2(this.masterPasswordHash, this.saltyHash, {
            keySize: 32,
            iterations: 100000
        }).toString();
    }

    addPassEntry(tag = "", username = "", email = "", altEmail = "", password = "", secrets = [], hints = [], comments = []) {
        let masterKey = this._generateMasterKey();

        let entry = new PassEntry();
        entry.setTag(tag);
        entry.setUsername(username);
        entry.setEmail(email);
        entry.setAltEmail(altEmail);
        entry.setPassword(this.encryptString(password, masterKey)); //hashed
        secrets.forEach(val => entry.addToSecrets(this.encryptString(val, masterKey))); //hashed
        hints.forEach(val => entry.addToHints(val));
        comments.forEach(val => entry.addToComments(val));
        
        this.entries.push(entry);
        
        return true;
    }

    encryptString(str, masterKey = "") {
        if(!masterKey) {
            masterKey = this._generateMasterKey();
        }
        return this.passHandler.encryptToString(str, masterKey);
    }

    decryptString(str, masterKey = "") {
        if(!masterKey) {
            masterKey = this._generateMasterKey();
        }
        return this.passHandler.decryptToString(str, masterKey);
    }

    entriesFromString(str) {
        let passEntryStrings = str.split(this.config.PassEntrySeparator);
        let passEntries = []
        passEntryStrings.forEach(passEntryString => {
            passEntries.push(new PassEntry().fromString(passEntryString));
        });

        return passEntries;
    }

    setEntries(entries) {
        this.entries = entries;
    }

    entriesToString() {
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
                entry.setTag("" + index);
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
        return this.hashToString(CryptoJS.AES.encrypt(stringToEncrypt, key), encoding);
    }

    decryptToString(encryptedString, key, encoding = CryptoJS.enc.Utf8) {
        return this.hashToString(CryptoJS.AES.decrypt(encryptedString, key), encoding);
    }

    hashToString(hash, encoder) {
        return hash.toString(encoder)
    }
}

function runTestCases(){
    let testPassEntryString = "Fb[|][|]something[|]hehe[|]ok[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here";
    let testPassEntryString1 = "[|][|]something[|]hehe[|]ok[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here";
    let testPassEntryString2 = "0[|][|]something[|]hehe[|]ok[|]this[*]secret[|]what[*]the[*]heck[|]comment[*]here";

    let testPassEntry = new PassEntry();

    if(testPassEntry.fromString(testPassEntryString).toString() !== testPassEntryString) throw new Error ("Something is wrong with PassEntry string conversion");

    let testPassManager = new PassManager();

    testPassManager.entries = testPassManager.entriesFromString(testPassEntryString);
    if(testPassManager.entriesToString() !== testPassEntryString) throw new Error ("Something is wrong with PassManager string conversion");

    testPassManager.entries = testPassManager.entriesFromString(testPassEntryString1);
    if(testPassManager.entriesToString() !== testPassEntryString2) throw new Error ("Something is wrong with PassManager string conversion – uniquelyIdentifyEntries");

    console.log("All tests passed");
}