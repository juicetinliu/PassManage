const CryptoWorkerFunctions = {
    PBKDF2: "PBKDF2",
    PING: "PING",
}

const CryptoWorkerStates = {
    NOT_MY_RESULT: "NOT_MY_RESULT",
    IM_PRESENT: "IM_PRESENT",
}

const CryptoWorkerFunctionParameters = {
    PBKDF2: ["masterPasswordHash", "secretHash", "keySize", "iterations"],
    PING: [],
}

class CryptoWorker extends Worker{
    constructor() {
        super('cryptoWorker.js');
        this.jobID = 0;
        this.MAX_REQUEST_RETRY = 5;
        this.REQUEST_RETRY_DELAY_MS = 250;

        this.onmessageQueue = [];

        this.onmessage = (event) => {
            this.onmessageQueue.forEach(f => f(event));
            this.onmessageQueue = [];
        }
    }

    request(func, parameters = {}) {
        let currJobID = this.jobID;
        this.jobID += 1;
        let thisJob = [currJobID, func, parameters];

        if(Object.values(CryptoWorkerFunctions).includes(func)) {
            this.postMessage(thisJob);
        } else {
            throw new Error("Function " + func + " not runnable");
        }
        return currJobID;
    }

    pushToOnmessageQueue(func) {
        this.onmessageQueue.push(func);
    }

    getResponseForID(e, id) {
        let jobID = e.data[0];
        let response = e.data[1];

        if(jobID !== id) {
            return CryptoWorkerStates.NOT_MY_RESULT;
        }
        return response;
    }
}

class FallbackMobileWorker{
    constructor() {
    }

    async request(func, parameters = {}) {
        let result = null;
        debugLog("Request received on fallback worker and working on " + func);

        this.checkRequiredParamsExistForFunction(func, parameters);

        if(func === CryptoWorkerFunctions.PBKDF2) {
            let masterPasswordHash = parameters.masterPasswordHash;
            let secretHash = parameters.secretHash;
            let keySize = parseInt(parameters.keySize);
            let iterations = parseInt(parameters.iterations);
            
            result = await CryptoJS.PBKDF2(masterPasswordHash, secretHash, {
                keySize: keySize,
                iterations: iterations
            }).toString();
        }
        debugLog("Sending result back");
        return result; 
    }

    checkRequiredParamsExistForFunction(func, params) {
        CryptoWorkerFunctionParameters[func].forEach(p => {
            if(!params[p]) throw new Error("Missing " + p + " for function " + func);
        });
    }
}