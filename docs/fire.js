import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js";
import { getDatabase, ref, child, get, set, push, remove } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-auth.js"

import { PassEntry } from "./pass.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDD5xuaEvWAFhSm2IRsi0PU2r6EwdsFz_E",
    authDomain: "passmanage-76044.firebaseapp.com",
    databaseURL: "https://passmanage-76044-default-rtdb.firebaseio.com",
    projectId: "passmanage-76044",
    storageBucket: "passmanage-76044.appspot.com",
    messagingSenderId: "614137979253",
    appId: "1:614137979253:web:c02f783b94a7904e9d733c",
    measurementId: "G-JPGY2WPFHW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dbRef = ref(getDatabase());

export class Fire {
    constructor() {
        this.fireUser = null;

        this.PATHS = {
            USERS: "/users",
            PASS_ENTRIES: "/passEntries",
            COMMON: "/common",
            SECRET_KEY: "/secretKey",
            FILE_SECRET: "/fileSecret",
        }
    }

    getUserName() {
        return this.validateFireUser(false) ? this.fireUser.email : null;
    }

    async createNewAccount(email, password, type) { //and sign in
        this.validateAccount(email, password);
        
        debugLog("Creating account");
        await createNewUser(email, password).then((user) => {
            this.fireUser = user;
            debugLog("Account created successfully");
        })
        .catch((e) => {
            this.handleAppError(e, true);
        });
    }

    async signInAccount(email, password, type) {
        this.validateAccount(email, password);
        
        debugLog("Signing in");
        await signInUser(email, password).then((user) => {
            this.fireUser = user;
            debugLog("Signed in successfully");
        })
        .catch((e) => {
            this.handleAppError(e, true);
        });
    }

    async signOutAccount() {
        this.validateFireUser(false);

        debugLog("Signing out");
        await signOutUser().then(() => {
            this.fireUser = null;
            debugLog("Signed out successfully");
        })
        .catch((e) => {
            this.handleAppError(e, true);
        });
    }

    async addOrSetPassEntry(passEntry) {
        if(!this.validateFireUser()) return;

        this.validatePassEntry(passEntry);

        let passEntryPath = this.buildPassEntriesPath(this.fireUser.uid);

        if(passEntry.fireKey) {
            passEntryPath += "/" + passEntry.fireKey;
            await setUserData(passEntryPath, passEntry.export(false, true)).catch((e) => this.handleAppError(e));
        } else {
            let key = await pushUserData(passEntryPath, passEntry.export(false)).then((key) => {
                return key;
            }).catch((e) => this.handleAppError(e));

            passEntry.setFireKey(key);
            let passEntryKeyPath = passEntryPath + "/" + key + "/fireKey/";
            await setUserData(passEntryKeyPath, key).catch((e) => this.handleAppError(e));
        }
    }

    async setSecretKey(secretKey) { //overwrites skey
        if(!this.validateFireUser()) return;

        let secretKeyPath = this.buildSecretKeyPath(this.fireUser.uid);
        await setUserData(secretKeyPath, secretKey).catch((e) => this.handleAppError(e));
    }

    async getSecretKey() {
        if(!this.validateFireUser()) return;

        let secretKeyPath = this.buildSecretKeyPath(this.fireUser.uid);
        let secretKey;
        await getUserData(secretKeyPath).then((fireSecretKey) => {
            secretKey = fireSecretKey;
        }).catch((e) => this.handleAppError(e));

        return secretKey;
    }

    async setFileSecret(fileSecret) { //overwrites fs
        if(!this.validateFireUser()) return;

        let fileSecretPath = this.buildFileSecretPath(this.fireUser.uid);
        await setUserData(fileSecretPath, fileSecret).catch((e) => this.handleAppError(e));
    }

    async getFileSecret() {
        if(!this.validateFireUser()) return;

        let fileSecretPath = this.buildFileSecretPath(this.fireUser.uid);
        let fileSecret;
        await getUserData(fileSecretPath).then((fireFileSecret) => {
            fileSecret = fireFileSecret;
        }).catch((e) => this.handleAppError(e));

        return fileSecret;
    }

    async getAllPassEntries() {
        if(!this.validateFireUser()) return;

        let passEntryPath = this.buildPassEntriesPath(this.fireUser.uid);
        let fireData = [];
        
        await getUserData(passEntryPath).then((data) => {
            if(data) fireData = data; //if null then we keep empty array
        }).catch((e) => this.handleAppError(e));

        let out = [];
        Object.values(fireData).forEach((fireEntry) => {
            let newPassEntry = new PassEntry().fromObject(fireEntry);
            if(fireEntry.fireKey) {newPassEntry.setFireKey(fireEntry.fireKey)}
            out.push(newPassEntry);
        })

        return out;
    }

    async deletePassEntry(passEntry) {
        if(!this.validateFireUser()) return;

        this.validatePassEntry(passEntry);

        let passEntryPath = this.buildPassEntriesPath(this.fireUser.uid);

        if(passEntry.fireKey) {
            passEntryPath += "/" + passEntry.fireKey;
            await removeUserData(passEntryPath).catch((e) => this.handleAppError(e));
        } else {
            throw new Error("PassEntry needs a Fire key to be deleted");
        }
    }


    buildFileSecretPath(uid) {
        return this.PATHS.USERS + "/" + uid + this.PATHS.FILE_SECRET;
    }

    buildSecretKeyPath(uid) {
        return this.PATHS.USERS + "/" + uid + this.PATHS.SECRET_KEY;
    }

    buildPassEntriesPath(uid) {
        return this.PATHS.USERS + "/" + uid + this.PATHS.PASS_ENTRIES;
    }

    validatePassEntry(passEntry) {
        if(!(passEntry instanceof PassEntry)) {
            throw new Error("PassEntry must be provided");
        }
    }

    validateFireUser(throwError = true) {
        if(!this.fireUser) {
            if(throwError) {
                throw new AppError("No user logged in", AppErrorType.FIRE.NO_USER_SIGNED_IN);
            } else {
                debugLog("No user logged in");
                return false;
            }
        }
        return true;
    }

    validateAccount(email, password) {
        if(!email) throw new Error("Missing email");
        if(!password) throw new Error("Missing password");
    }

    handleAppError(e, throwError = false) {
        if(e instanceof AppError) {
            if(throwError) {
                throw e;
            } else {
                debugLog(e); 
            }
        } else {
            debugLog("Unexpected Error");
            throw e;
        }
    }
}

async function getUserData(path = "") {
    let out = null;
    await get(child(dbRef, path)).then((snapshot) => {
        if(snapshot.exists()) {
            out = snapshot.val();
        } else {
            throw new AppError("No data available", AppErrorType.FIRE.DATA_READ_ERROR);
        }
    }).catch((error) => {
        let errorMessage = "(" + error.code + ")" + error.message;
        throw new AppError(errorMessage, AppErrorType.FIRE.DATA_READ_ERROR);
    });
    return out;
}

async function removeUserData(path = "") {
    await remove(child(dbRef, path)).catch((error) => {
        let errorMessage = "(" + error.code + ")" + error.message;
        throw new AppError(errorMessage, AppErrorType.FIRE.DATA_WRITE_ERROR);
    });
}

async function setUserData(path = "", data) {
    if(!data) {
        throw new AppError("No data present", AppErrorType.FIRE.DATA_WRITE_ERROR);
    }

    await set(child(dbRef, path), data).catch((error) => {
        let errorMessage = "(" + error.code + ")" + error.message;
        throw new AppError(errorMessage, AppErrorType.FIRE.DATA_WRITE_ERROR);
    });
}

async function pushUserData(path = "", data) {
    if(!data) {
        throw new AppError("No data present", AppErrorType.FIRE.DATA_WRITE_ERROR);
    }
    
    let returnKey;
    await push(child(dbRef, path), data).then((ref) => {
        returnKey = ref.key;
    }).catch((error) => {
        let errorMessage = "(" + error.code + ")" + error.message;
        throw new AppError(errorMessage, AppErrorType.FIRE.DATA_WRITE_ERROR);
    });

    return returnKey;
}









//https://firebase.google.com/docs/auth/web/password-auth
async function createNewUser(email, password) {
    let out = null;

    await createUserWithEmailAndPassword(auth, email, password).then((user) => {
        out = user.user;
    }).catch((error) => {
        let errorCode = error.code;
        let errorMessage = "(" + errorCode + ")" + error.message;

        if(errorCode === "auth/invalid-email") {
            throw new AppError(errorMessage, AppErrorType.FIRE.INVALID_EMAIL);
        } else if(errorCode === "auth/email-already-in-use") {
            throw new AppError(errorMessage, AppErrorType.FIRE.CREATE_ACCOUNT_ERROR.EMAIL_IN_USE);
        } else if(errorCode === "auth/weak-password") {
            throw new AppError(errorMessage, AppErrorType.FIRE.CREATE_ACCOUNT_ERROR.WEAK_PASSWORD);
        }
        throw new AppError(errorMessage, AppErrorType.FIRE.CREATE_ACCOUNT_ERROR.GENERAL);
    });

    return out;
}

async function signInUser(email, password) {
    let out = null;

    await signInWithEmailAndPassword(auth, email, password).then((user) => {
        out = user.user;
    }).catch((error) => {
        let errorCode = error.code;
        let errorMessage = "(" + errorCode + ")" + error.message;
        
        if(errorCode === "auth/invalid-email") {
            throw new AppError(errorMessage, AppErrorType.FIRE.INVALID_EMAIL);
        } else if(errorCode === "auth/user-not-found") {
            throw new AppError(errorMessage, AppErrorType.FIRE.SIGN_IN_ERROR.USER_NOT_FOUND);
        } else if(errorCode === "auth/wrong-password") {
            throw new AppError(errorMessage, AppErrorType.FIRE.SIGN_IN_ERROR.WRONG_PASSWORD);
        } else if(errorCode === "auth/too-many-requests") {
            throw new AppError(errorMessage, AppErrorType.FIRE.SIGN_IN_ERROR.TOO_MANY_REQUESTS);
        }
        throw new AppError(errorMessage, AppErrorType.FIRE.SIGN_IN_ERROR.GENERAL);
    });

    return out;
}

async function signOutUser() {
    await signOut(auth).catch((error) => {
        let errorCode = error.code;
        let errorMessage = "(" + errorCode + ")" + error.message;

        throw new AppError(errorMessage, AppErrorType.FIRE.SIGN_OUT_ERROR);
    });
    return true;
}