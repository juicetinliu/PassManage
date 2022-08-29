import { App, MobileAppWIP } from "./app.js";
import { runTestCases } from "./pass.js";

// runTestCases();
if(!is_mobile_or_tablet_view()) {
    let a = new App();
    a.start();
} else {
    let a = new MobileAppWIP();
    a.start();
}