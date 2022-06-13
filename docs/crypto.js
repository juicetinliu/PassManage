const CryptoWorkerFunctions = {
    PBKDF2: "PBKDF2"
}

const CryptoWorkerFunctionParameters = {
    PBKDF2: ["masterPasswordHash", "deviceSecretHash", "keySize", "iterations"]
}

class CryptoWorker extends Worker{
    constructor() {
        super('cryptoWorker.js');

        this.working = false;
        this.workingFunc = null;
    }

    request(func, parameters = {}) {
        if(!this.working){
            this.working = true;
            this.workingFunc = func;

            if(func === CryptoWorkerFunctions.PBKDF2) {
                this.postMessage([func, parameters]);
                console.log("Request sent to worker");
            } else {
                throw new Error("Function " + func + " not runnable");
            }
        } else{ 
            throw new AppError("CryptoWorker is working on " + this.workingFunc, AppErrorType.GENERATING_MASTER_KEY);
        }
    }

    getResponse(e) {
        let out = null;
        if(this.workingFunc === CryptoWorkerFunctions.PBKDF2) {
            out = e.data;
        }

        this.reset();
        return out;
    }

    reset() {
        this.working = false;
        this.workingFunc = null;
    }
}