import fs from 'fs';
import Core from './core';

const text = `
||agnesb.fr
||akiba-web.com
||altrec.com
||angela-merkel.de
||angola.org
||apartmentratings.com
||apartments.com
||arena.taipei
||asianspiss.com
||assimp.org
.expekt.com
||expekt.com
.inc.co
|http://example.com
.exa.mple.com
||apple.com
`.trim();



const rules = text.split("\n");


const core = new Core()

rules.forEach(r => {
    core.addRule(r);
})

function ruleAssert(rule: string, condition: boolean) {
    console.assert(core.isMatch(rule) === condition, `${rule}`);
}

ruleAssert('http://example.com', true);
ruleAssert('http://a.example.com', false);
ruleAssert('http://b.example.com', false);
ruleAssert('http://b.example.com', false);
ruleAssert('http://water.inc.co', true);
ruleAssert('https://water.inc.co', true);
ruleAssert('https://blue.inc.co', true);
ruleAssert('http://apple.com', true);
ruleAssert('https://apple.com', true);
ruleAssert('http://inc.co', false);
ruleAssert('http://pc.inc.co', true);
ruleAssert('http://pc.inc.co/index.html', true);