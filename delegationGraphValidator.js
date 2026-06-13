const { ethers } = require("ethers");

function validateDelegationGraph({ delegation, execution, env }) {
  console.log("Validating delegation graph...");

  if (!delegation) throw new Error("missing delegation");
  if (!execution) throw new Error("missing execution");
  if (!ethers.isAddress(delegation.delegate)) throw new Error("invalid delegate");
  if (!ethers.isAddress(delegation.delegator)) throw new Error("invalid delegator");
  if (!ethers.isAddress(execution.target)) throw new Error("invalid execution target: " + execution.target);

  // Allowed targets are in caveat[0] (AllowedTargetsEnforcer)
  const allowedTargets = (delegation.caveats || [])
    .filter(function(c) { return c.enforcer === "0x7F20f61b1f09b08D970938F6fa563634d65c4EeB"; })
    .map(function(c) { return "0x" + c.terms.slice(2).slice(0, 40); });

  if (allowedTargets.length > 0) {
    var targetMatch = false;
    for (var i = 0; i < allowedTargets.length; i++) {
      if (allowedTargets[i].toLowerCase() === execution.target.toLowerCase()) {
        targetMatch = true;
        break;
      }
    }
    if (!targetMatch) {
      console.log("Allowed targets:", allowedTargets);
      throw new Error("execution target " + execution.target + " not authorized by delegation");
    }
  }

  // Allowed selectors are in caveat[1] (AllowedMethodsEnforcer)
  var execSelector = execution.callData.slice(0, 10);
  var allowedSelectors = (delegation.caveats || [])
    .filter(function(c) { return c.enforcer === "0x2c21fD0Cb9DC8445CB3fb0DC5E7Bb0Aca01842B5"; })
    .map(function(c) { return c.terms; });

  if (allowedSelectors.length > 0) {
    var selMatch = false;
    for (var j = 0; j < allowedSelectors.length; j++) {
      if (allowedSelectors[j].toLowerCase().indexOf(execSelector.toLowerCase().replace("0x", "")) !== -1) {
        selMatch = true;
        break;
      }
    }
    if (!selMatch) {
      console.log("Allowed selectors:", allowedSelectors);
      throw new Error("execution selector " + execSelector + " not authorized");
    }
  }

  console.log("Graph VALID\n");
  return true;
}

module.exports = { validateDelegationGraph };
