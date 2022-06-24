importScripts('libraries/crypto-js.min.js');
importScripts('crypto.js');

let completedJobsWithResultCache = [];

let debug = false;
let CLEAR_CACHE_TIMEOUT_MS = 5 * 1000; //WORKER ONLY KEEPS RESULT FOR 5 SECONDS SINCE PASSMANAGER HAS ITS OWN CACHE (about the time it takes to calculate pbkdf2)

onmessage = function(e) {
    let jobID = e.data[0]
    let func = e.data[1];

    let parameters = e.data[2];
    let thisJob = {
        id: jobID,
        func: func,
        params: parameters
    };

    let cachedJobFound = false;
    completedJobsWithResultCache.find(jobWithResult => {
        if(areJobsEqual(thisJob, jobWithResult[0])) {
            if(debug) console.log(jobID, "Cached result found");
            cachedJobFound = true;
            processResult(jobWithResult[1], thisJob);
            return;
        }
    }); //if job was already done then return cached result

    if(!cachedJobFound) {
        let result = null;
        if(debug) console.log(jobID, "Request received and working on " + func);

        checkRequiredParamsExistForFunction(func, parameters);

        if(func === CryptoWorkerFunctions.PBKDF2) {
            let masterPasswordHash = parameters.masterPasswordHash;
            let deviceSecretHash = parameters.deviceSecretHash;
            let keySize = parseInt(parameters.keySize);
            let iterations = parseInt(parameters.iterations);
            result = CryptoJS.PBKDF2(masterPasswordHash, deviceSecretHash, {
                keySize: keySize,
                iterations: iterations
            }).toString();
        }

        processResult(result, thisJob); 
    }
}

function processResult(result, job) {
    completedJobsWithResultCache.push([job, result]);

    setTimeout(function() {
        completedJobsWithResultCache = [];
    }, CLEAR_CACHE_TIMEOUT_MS);

    if(debug) console.log(job.id, "Sending result back");

    postMessage([job.id, result]); //submit job result to all listeners
}

function checkRequiredParamsExistForFunction(func, params) {
    CryptoWorkerFunctionParameters[func].forEach(p => {
        if(!params[p]) throw new Error("Missing " + p + " for function " + func);
    });
}

function areJobsEqual(job1, job2) {
    CryptoWorkerFunctionParameters[job1.func].forEach(param => {
        if(job1.params[param] !== job2.params[param]) return false;
    })
    return job1.func === job2.func;
}