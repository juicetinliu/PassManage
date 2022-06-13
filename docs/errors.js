const AppErrorType = {
    MISSING_MASTER_PASSWORD: "MasterPasswordMissing",
    INVALID_MASTER_PASSWORD: "MasterPasswordInvalid",

    GENERATING_MASTER_KEY: "GeneratingMasterKey"
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