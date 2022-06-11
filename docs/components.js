const HtmlTypes = {
    CLASS: "CLASS",
    ID: "ID",
    ERROR: "ERROR",
};

class Element {
    constructor(type, label) {
        this.type = this.getType(type);
        this.label = label;

        this.HIDE_CLASS = "hide";
    }

    getType(type) {
        if(type === "class") {
            return HtmlTypes.CLASS;
        } else if(type === "id") {
            return HtmlTypes.ID;
        } else {
            return HtmlTypes.ERROR;
        }
    }

    getElement() {
        if(this.type === HtmlTypes.CLASS) {
            return document.getElementsByClassName(this.label);
        } else if(this.type === HtmlTypes.ID) {
            return document.getElementById(this.label);
        } else {
            throw new Error("No element found");
        }
    }

    addEventListener(events, func) {
        if(!Array.isArray(events)) throw new Error("events should be an Array");

        events.forEach(e => {
            this.getElement().addEventListener(e, func);
        })
    }

    hide() {
        this.getElement().classList.add(this.HIDE_CLASS);
    }

    show() {
        this.getElement().classList.remove(this.HIDE_CLASS);
    }
}

class Component { 
    constructor(elementId, app) {
        this.component = new Element("id", elementId);
        this.app = app;
    }

    show() {
        this.component.show();
    }

    hide() {
        this.component.hide();
    }

    setup() {}
}

class MainOptionsBar extends Component {
    constructor(app) {
        super('main-page-options', app);
    }
}