const { ethers } = require("ethers");

class AgentDiscovery {
  constructor(provider, vaultAddress, wallet) {
    this.provider = provider;
    this.vault = new ethers.Contract(vaultAddress, [
      "function getAgentPatterns(address) view returns (string[])",
      "function getPattern(string) view returns (string,string,string,string[],string[],uint256,address)",
      "function hasAccess(address,string) view returns (bool)",
      "function delegateAccess(string,address)",
    ], wallet);
    this.wallet = wallet;
    this.knownAgents = [];
  }

  registerAgent(address, name) {
    this.knownAgents.push({ address: address.toLowerCase(), name: name });
  }

  async discoverAllPatterns() {
    var allPatterns = [];
    for (var i = 0; i < this.knownAgents.length; i++) {
      var agent = this.knownAgents[i];
      try {
        var ids = await this.vault.getAgentPatterns(agent.address);
        for (var j = 0; j < ids.length; j++) {
          try {
            var hasAccess = await this.vault.hasAccess(this.wallet.address, ids[j]);
            var pattern = await this.vault.getPattern(ids[j]);
            allPatterns.push({
              patternId: ids[j],
              name: pattern[0],
              description: pattern[1],
              tags: pattern[3],
              features: pattern[4],
              successCount: Number(pattern[5]),
              creator: pattern[6],
              sourceAgent: agent.name,
              hasAccess: hasAccess,
            });
          } catch(e) {}
        }
      } catch(e) {}
    }
    return allPatterns;
  }

  async requestAccessToTopPatterns(searchWords, maxResults) {
    maxResults = maxResults || 3;
    var scored = [];
    for (var i = 0; i < this.discoveredPatterns.length; i++) {
      var p = this.discoveredPatterns[i];
      if (p.hasAccess) continue;
      var matchCount = 0;
      for (var j = 0; j < (p.tags || []).length; j++) {
        for (var k = 0; k < searchWords.length; k++) {
          if (p.tags[j].toLowerCase().indexOf(searchWords[k].toLowerCase()) !== -1 || searchWords[k].toLowerCase().indexOf(p.tags[j].toLowerCase()) !== -1) {
            matchCount++;
          }
        }
      }
      if (matchCount > 0) scored.push({ pattern: p, score: matchCount });
    }
    scored.sort(function(a, b) { return b.score - a.score; });
    scored = scored.slice(0, maxResults);

    for (var s = 0; s < scored.length; s++) {
      try {
        var tx = await this.vault.delegateAccess(scored[s].pattern.patternId, this.wallet.address);
        await tx.wait();
        console.log("   ✓ Access granted to " + scored[s].pattern.name + " from " + scored[s].pattern.sourceAgent);
      } catch(e) {}
    }
    return scored.map(function(s) { return s.pattern; });
  }

  async getCrossAgentPatterns(searchWords) {
    this.discoveredPatterns = await this.discoverAllPatterns();
    await this.requestAccessToTopPatterns(searchWords);
    
    var results = [];
    for (var i = 0; i < this.discoveredPatterns.length; i++) {
      var p = this.discoveredPatterns[i];
      var matchCount = 0;
      for (var j = 0; j < (p.tags || []).length; j++) {
        for (var k = 0; k < searchWords.length; k++) {
          if (p.tags[j].toLowerCase().indexOf(searchWords[k].toLowerCase()) !== -1 || searchWords[k].toLowerCase().indexOf(p.tags[j].toLowerCase()) !== -1) {
            matchCount++;
          }
        }
      }
      if (matchCount > 0) results.push({ id: p.patternId, name: p.name, description: p.description, code: '', tags: p.tags, features: p.features, successCount: p.successCount, creator: p.creator, score: matchCount, source: 'cross-agent', sourceAgent: p.sourceAgent });
    }
    results.sort(function(a, b) { return b.score - a.score; });
    return results.slice(0, 5);
  }
}

module.exports = { AgentDiscovery };
