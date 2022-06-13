importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.js');
importScripts('crypto.js');

onmessage = function(e) {
    let func = e.data[0];
    let parameters = e.data[1];

    console.log("Request received and working on " + func);

    checkRequiredParamsExistForFunction(func, parameters);

    if(func === CryptoWorkerFunctions.PBKDF2) {
        let masterPasswordHash = parameters.masterPasswordHash;
        let deviceSecretHash = parameters.deviceSecretHash;
        let keySize = parseInt(parameters.keySize);
        let iterations = parseInt(parameters.iterations);
        sendResult(CryptoJS.PBKDF2(masterPasswordHash, deviceSecretHash, {
            keySize: keySize,
            iterations: iterations
        }).toString());
    }
}

function sendResult(result) {
    console.log("Sending result back");

    postMessage(result);
}

function checkRequiredParamsExistForFunction(func, params) {
    CryptoWorkerFunctionParameters[func].forEach(p => {
        if(!params[p]) throw new Error("Missing " + p + " for function " + func);
    });
}