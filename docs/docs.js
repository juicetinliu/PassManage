import { App, MobileAppWIP } from "./app.js";
import { runTestCases } from "./pass.js";

// runTestCases();
let isMobile = window.innerWidth < 500 || is_mobile_or_tablet_view();
let a = new App(isMobile);
a.start();


// Loading gifs from Giphy:
// https://media2.giphy.com/media/14c0YMK7oEVs0o/giphy.gif?cid=790b76116a44e15c7cc7459831d1b7d2af396b4c2c8bf0e3&rid=giphy.gif&ct=g
// https://media0.giphy.com/media/Q0MrhO9BUSxKR8RdZC/giphy.gif?cid=790b7611301e2a534e26776238f0e19d033e57ad8b437fdc&rid=giphy.gif&ct=g
// https://media2.giphy.com/media/l3nWhI38IWDofyDrW/giphy.gif?cid=ecf05e47k6s0s111u2kkoelejlji6glir9t5qs203mruqswq&rid=giphy.gif&ct=g
// https://media4.giphy.com/media/RFyrOA1OiYpTpEGNIW/giphy.gif?cid=790b76111881f4cbe211cd03b31c682b098b70676d290de0&rid=giphy.gif&ct=g