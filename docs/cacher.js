export const CacheKeys = {
    COLOR_THEME: {
        Key: "c",
        Discrete: true,
        Values: ["LIGHT", "DARK"],
        LIGHT: "LIGHT",
        DARK: "DARK",
    },
    DRAGGABLE_MENU_ORIENTATION: {
        Key: "dmo",
        Discrete: true,
        Values: ["HORIZONTAL", "VERTICAL"],
        HORIZONTAL: "HORIZONTAL",
        VERTICAL: "VERTICAL",
    },
    SHOW_INTRO_TOOLTIPS: {
        Key: "sit",
        Discrete: true,
        Values: ["YES", "NO"],
        YES: true,
        NO: false
    }
}

export class CacheManager {
    constructor(app) {
        this.app = app;
    }

    retrieveInitialValueAndStore(key) { //ALWAYS call this first when intitializing value
        if(!this.doesCacheKeyExist(key)) this.throwKeyNotFoundError(key);

        let storedData = this.retrieve(key);
        if (storedData === null) {
            storedData = key.Values[0]; //Values[0] is default value
            this.store(key, storedData);
        }
        return storedData;
    }

    doesCacheKeyExist(key) {
        if(key.Values) return true;
        return false;
    }

    throwKeyNotFoundError(key) {
        throw new AppError(key + " Key doesn't exist", AppErrorType.CACHE_ERROR);
    }

    throwValueNotFoundError(data, key) {
        throw new AppError(data + " doesn't exist for key " + key, AppErrorType.CACHE_ERROR);
    }

    store(key, data) {
        if(key.Discrete) {
            //data must be in string form - see key.values for allowed values
            if(!this.doesCacheKeyExist(key)) this.throwKeyNotFoundError(key);
            if(!key.Values.includes(data)) this.throwValueNotFoundError(data, key);
            localStorage.setItem(key.Key, key[data]);
        } else {
            localStorage.setItem(key.Key, data);
        }
    }

    retrieve(key) {
        if(!this.doesCacheKeyExist(key)) this.throwKeyNotFoundError(key);
        return localStorage.getItem(key.Key);
    }

    remove(key) {
        if(!this.doesCacheKeyExist(key)) this.throwKeyNotFoundError(key);
        localStorage.removeItem(key.Key);
    }
}
