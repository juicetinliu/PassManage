const CryptoWorkerFunctions = {
    PBKDF2: "PBKDF2",
    NOTMYRESULT: "NOTMYRESULT"
}

const CryptoWorkerFunctionParameters = {
    PBKDF2: ["masterPasswordHash", "secretHash", "keySize", "iterations"]
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

        if(func === CryptoWorkerFunctions.PBKDF2) {
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
            return CryptoWorkerFunctions.NOTMYRESULT;
        }
        return response;
    }
}