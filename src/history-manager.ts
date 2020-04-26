import * as types from './types';
import { clone, buildGroupSummary } from './util';
import { BaseRuleGroup } from './group';
export class HistoryManager {

    private history: types.History[]
    private enable: boolean;
    constructor() {
        this.history = []
        this.enable = false;
    }
    
    destory() {
        this.history = []
    }

    enableLog() {
        this.enable = true;
    }
    disableLog() {
        this.enable = false;
    }

    private addHistory(event: string, request?: types.RequestSummary, groupConfig?: types.GroupSummary) {
        this.history.push({
            event,
            request,
            groupConfig,
        });
    }

    addHitCache(requestSummary: types.RequestSummary) {
        if (!this.enable) {
            return;
        }
        this.addHistory('hit cache', clone(requestSummary));
    }

    addMatch(requestSummary: types.RequestSummary, ruleGroup: BaseRuleGroup) {
        if (!this.enable) {
            return;
        }
        this.addHistory('match', clone(requestSummary), buildGroupSummary(ruleGroup));
    }

    addNotMatch(requestSummary: types.RequestSummary) {
        if (!this.enable) {
            return;
        }
        this.addHistory('not match', requestSummary);
    }
}