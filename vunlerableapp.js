/**
 * Demo file for SonarQube teaching — JavaScript/Node.js
 * Contains intentional: Bugs, Vulnerabilities, Code Smells
 */

// ============================================================
// VULNERABILITY 1: Hardcoded credentials
// SonarQube Rule: javascript:S2068
// ============================================================
const DB_PASSWORD = "root123";
const JWT_SECRET  = "mysupersecretjwtkey";
const AWS_KEY     = "AKIAIOSFODNN7EXAMPLE";


// ============================================================
// VULNERABILITY 2: SQL Injection
// SonarQube Rule: javascript:S3649
// ============================================================
function getUser(username) {
  const query = "SELECT * FROM users WHERE name = '" + username + "'";
  // VULNERABLE: string concatenation in SQL
  db.execute(query);
}


// ============================================================
// VULNERABILITY 3: Cross-Site Scripting (XSS)
// SonarQube Rule: javascript:S5725
// ============================================================
function renderUserInput(userInput) {
  // VULNERABLE: directly inserting user input into DOM
  document.getElementById("output").innerHTML = userInput;
}


// ============================================================
// VULNERABILITY 4: eval() with user input
// SonarQube Rule: javascript:S1523
// ============================================================
function calculate(expression) {
  // VULNERABLE: eval executes arbitrary code
  return eval(expression);
}


// ============================================================
// VULNERABILITY 5: Disabled certificate verification
// SonarQube Rule: javascript:S4830
// ============================================================
const https = require("https");
const agent = new https.Agent({
  rejectUnauthorized: false   // VULNERABLE: disables SSL cert check
});


// ============================================================
// BUG 1: == instead of === (loose equality)
// SonarQube Rule: javascript:S1757
// ============================================================
function isAdmin(role) {
  if (role == 1) {   // BUG: use === for strict comparison
    return true;
  }
  return false;
}


// ============================================================
// BUG 2: Callback result ignored (promise not awaited)
// SonarQube Rule: javascript:S4328
// ============================================================
async function saveUser(user) {
  fetch("/api/save", {   // BUG: promise not awaited, errors silently lost
    method: "POST",
    body: JSON.stringify(user)
  });
  return "saved";
}


// ============================================================
// BUG 3: Unreachable code after return
// SonarQube Rule: javascript:S1763
// ============================================================
function getDiscount(type) {
  return 0.1;
  console.log("Calculating discount...");   // BUG: never executed
}


// ============================================================
// BUG 4: NaN comparison using ==
// SonarQube Rule: javascript:S2688
// ============================================================
function checkValue(val) {
  if (val == NaN) {   // BUG: NaN != NaN always, use isNaN()
    return "invalid";
  }
  return val;
}


// ============================================================
// CODE SMELL 1: Deeply nested callbacks (callback hell)
// SonarQube Rule: javascript:S3776 (cognitive complexity)
// ============================================================
function processOrder(order) {
  if (order) {
    if (order.user) {
      if (order.user.verified) {
        if (order.items) {
          if (order.items.length > 0) {
            if (order.payment) {
              console.log("process");   // SMELL: 6 levels deep
            }
          }
        }
      }
    }
  }
}


// ============================================================
// CODE SMELL 2: Console.log left in production code
// SonarQube Rule: javascript:S2228
// ============================================================
function login(user, pass) {
  console.log("User attempting login: " + user);   // SMELL: debug log
  console.log("Password: " + pass);                // SMELL: logs password!
  return true;
}


// ============================================================
// CODE SMELL 3: Empty catch block
// SonarQube Rule: javascript:S2486
// ============================================================
function parseConfig(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    // SMELL: error completely ignored
  }
}


// ============================================================
// CODE SMELL 4: var instead of let/const
// SonarQube Rule: javascript:S3504
// ============================================================
function calculateTotal(items) {
  var total = 0;          // SMELL: use const/let
  var discount = 0.1;     // SMELL: use const/let
  for (var i = 0; i < items.length; i++) {   // SMELL
    total += items[i].price;
  }
  return total - (total * discount);
}


// ============================================================
// CODE SMELL 5: Duplicate function logic
// SonarQube Rule: common:DuplicatedBlocks
// ============================================================
function sendEmailToAdmin(msg) {
  console.log("Connecting to mail server...");
  console.log("Authenticating...");
  console.log("Sending: " + msg);
  console.log("Done.");
}

function sendEmailToUser(msg) {
  console.log("Connecting to mail server...");
  console.log("Authenticating...");
  console.log("Sending: " + msg);
  console.log("Done.");   // SMELL: exact duplicate of sendEmailToAdmin
}
