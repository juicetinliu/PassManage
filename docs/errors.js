const debugLogs = false;
const debugLog = (arg) => {
    if(debugLogs) {
        console.log(arg);
        mobileDebug(arg);
    }
};

var mobileDebug = (arg) => {
    if(debugLogs) {
        let log = document.createElement("div");
        log.innerHTML = arg;
        let debugDiv = document.getElementById("DEBUG");
        debugDiv.appendChild(log);
        debugDiv.style.display = "block";
    }
}

const AppErrorType = {
    CACHE_ERROR: "CacheError",

    MISSING_APP_TOKEN: "AppTokenMissing",
    MISSING_MASTER_PASSWORD: "MasterPasswordMissing",
    INVALID_MASTER_PASSWORD: "MasterPasswordInvalid",

    GENERATING_MASTER_KEY: "GeneratingMasterKey",
    INVALID_PASS_ENTRY_FIELD: "InvalidPassEntryField",

    FIRE: {
        NO_USER_SIGNED_IN: "FireNoUserSignedIn",
        INVALID_EMAIL: "FireInvalidEmail",
        CREATE_ACCOUNT_ERROR: {
            EMAIL_IN_USE: "FireCreateAccountEmailInUse",
            WEAK_PASSWORD: "FireCreateAccountWeakPassword",
            GENERAL: "FireCreateAccountError",
        },
        SIGN_IN_ERROR: {
            USER_NOT_FOUND: "FireSignInUserNotFound",
            WRONG_PASSWORD: "FireSignInWrongPassword",
            TOO_MANY_REQUESTS: "FireSignInTooManyRequests",
            GENERAL: "FireSignInError",
        },
        SIGN_OUT_ERROR: "FireSignOutError",
        DATA_READ_ERROR: "FireDataReadError",
        DATA_WRITE_ERROR: "FireDataWriteError",
        GENERIC_ERROR: "FireGenericError"
    },
}

class AppError extends Error {
    constructor(message, type){
        super(message);

        if(!type) throw new Error("Missing AppError type");
        this.type = type;
    }

    isType(type) {
        return this.type === type;
    }
}

function handleAppErrorType(error, appErrorType, callBack) {
    if(typeof callBack !== "function") throw new Error("callBack must be a function");
    if(error instanceof AppError) {
        if(error.isType(appErrorType)){
            callBack(error);
        } else {
            throw error;
        }
    } else {
        throw error;
    }
}