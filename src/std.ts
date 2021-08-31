import type {
    Rule,
    Report,
    Report_Ok,
    Report_Ng
} from './core.ts'
import type {
    RuleMap,
    Optionally,
    Dictionary
} from './util.ts'

import {
    objectKeyExists,
    objectEntries
} from './util.ts'

export function mkRule<T>(validate: Validate): Rule<T> {
    return {
        meet(data): data is T {
            const valiRet = validate(data)
            return isOk_ValiRet(valiRet)
        },
        pass(data) {
            const valiRet = validate(data)
            if (isNg_ValiRet(valiRet)) {
                throw new Error('The data did not pass validation')
            }
            return data
        },
        check(data) {
            const valiRet = validate(data)
            return isOk_ValiRet(valiRet) ? mkReport_Ok(data) : mkReport_Ng()
        }
    }
}

export type Validate = (data: any) => ValiRet

export type ValiRet = ValiRet_Ok | ValiRet_Ng
export type ValiRet_Ok = {
    kind: 'ok'
}
export type ValiRet_Ng = {
    kind: 'ng'
}

export function mkValiRet_Ok(): ValiRet_Ok {
    return {
        kind: 'ok'
    }
}
export function mkValiRet_Ng(): ValiRet_Ng {
    return {
        kind: 'ng'
    }
}

function isOk_ValiRet<T>(valiRet: ValiRet): valiRet is ValiRet_Ok {
    return valiRet.kind === 'ok'
}
function isNg_ValiRet(valiRet: ValiRet): valiRet is ValiRet_Ng {
    return valiRet.kind === 'ng'
}

function mkReport_Ok<T>(data: T): Report_Ok<T> {
    return {
        kind: 'ok',
        data: data
    }
}
function mkReport_Ng(): Report_Ng {
    return {
        kind: 'ng'
    }
}

export function isOk_Report<T>(report: Report<T>): report is Report_Ok<T> {
    return report.kind === 'ok'
}
export function isNg_Report(report: Report<any>): report is Report_Ng {
    return report.kind === 'ng'
}

export const rule_String = mkRule<string>(
    data => typeof(data) === 'string' ? mkValiRet_Ok() : mkValiRet_Ng() // Data is not string.
)
export const rule_Number = mkRule<number>(
    data => typeof(data) === 'number' ? mkValiRet_Ok() : mkValiRet_Ng() // Data is not number.
)
export const rule_Boolean = mkRule<boolean>(
    data => typeof(data) === 'boolean' ? mkValiRet_Ok() : mkValiRet_Ng() // Data is not boolean.
)
export const rule_Bigint = mkRule<bigint>(
    data => typeof(data) === 'bigint' ? mkValiRet_Ok() : mkValiRet_Ng() // Data is not bigint.
)
export const rule_Symbol = mkRule<symbol>(
    data => typeof(data) === 'symbol' ? mkValiRet_Ok() : mkValiRet_Ng() // Data is not symbol.
)
export const rule_Undefined = mkRule<undefined>(
    data => typeof(data) === 'undefined' ? mkValiRet_Ok() : mkValiRet_Ng() // Data is not undefined.
)
export const rule_Null = mkRule<null>(
    data => data == null ? mkValiRet_Ok() : mkValiRet_Ng() // Data is not null.
)

export function mkRule_StrLit<T extends string>(value: T) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'string') {
                return mkValiRet_Ng() // Data is not string.
            }
            if (data !== value) {
                return mkValiRet_Ng() // Data is not '${value}'.
            }
            return mkValiRet_Ok()
        }
    )
}
export function mkRule_NumLit<T extends number>(value: T) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'number') {
                return mkValiRet_Ng() // Data is not number.
            }
            if (data !== value) {
                return mkValiRet_Ng() // Data is not ${value}.
            }
            return mkValiRet_Ok()
        }
    )
}
function mkRule_BoolLit<T extends boolean>(value: T) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'boolean') {
                return mkValiRet_Ng() // Data is not boolean.
            }
            if (data !== value) {
                return mkValiRet_Ng() // Data is not ${value}.
            }
            return mkValiRet_Ok()
        }
    )
}
export const rule_BoolTrue = mkRule_BoolLit(true)
export const rule_BoolFalse = mkRule_BoolLit(false)

export function mkRule_Array<E, T extends E[]>(elementRule: Rule<E>) {
    return mkRule<T>(
        data => {
            if (!Array.isArray(data)) {
                return mkValiRet_Ng() // Data is not array.
            }
            for (const elementData of data) {
                const elementReport = elementRule.check(elementData)
                if (isNg_Report(elementReport)) {
                    return mkValiRet_Ng() // Element data of index [${i}] is not valid.
                }
            }
            return mkValiRet_Ok()
        }
    )
}
export function mkRule_Dictionary<E, T extends Dictionary<E>>(elementRule: Rule<E>) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'object' || data == null) {
                return mkValiRet_Ng() // Data is not object.
            }
            for (const [, elementData] of objectEntries(data)) {
                const elementReport = elementRule.check(elementData)
                if (isNg_Report(elementReport)) {
                    return mkValiRet_Ng() // Element data of key [${key}] is not valid.
                }
            }
            return mkValiRet_Ok()
        }
    )
}
export function mkRule_Tuple<T extends any[]>(...elementRules: RuleMap<T>) {
    return mkRule<T>(
        data => {
            if (!Array.isArray(data)) {
                return mkValiRet_Ng() // Data is not array.
            }
            if (data.length !== elementRules.length) {
                return mkValiRet_Ng() // Data length is not match.
            }
            let i = 0
            for (const elementData of data) {
                const elementReport = elementRules[i].check(elementData)
                if (isNg_Report(elementReport)) {
                    return mkValiRet_Ng() // Element data of index [${i}] is not valid.
                }
                i++
            }
            return mkValiRet_Ok()
        }
    )
}
export function mkRule_ObjLit<OBJ,
T extends OPT extends (keyof OBJ)[] ? Optionally<OBJ, OPT[number]> : OBJ,
OPT extends (keyof OBJ)[] | undefined = undefined>(ruleMap: RuleMap<OBJ>, optionalKeys?: OPT) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'object' || data == null) {
                return mkValiRet_Ng() // Data is not object.
            }
            for (const [key, propertyData] of objectEntries(data)) {
                if (!objectKeyExists(ruleMap, key)) {
                    return mkValiRet_Ng() // Property data of key [${key}] does not exist in rule.
                }
                const propertyReport = ruleMap[key].check(propertyData)
                if (isNg_Report(propertyReport)) {
                    return mkValiRet_Ng() // Property data of key [${key}] is not valid.
                }
            }
            if (optionalKeys) {
                for (const [key] of objectEntries(ruleMap)) {
                    if (optionalKeys.indexOf(key) >= 0) {
                        continue // Current key is optional.
                    }
                    if (!objectKeyExists(data, key)) {
                        return mkValiRet_Ng() // Required property of key [${key}] does not exist in data.
                    }
                }
            } else {
                for (const [key] of objectEntries(ruleMap)) {
                    if (!objectKeyExists(data, key)) {
                        return mkValiRet_Ng() // Required property of key [${key}] does not exist in data.
                    }
                }
            }
            return mkValiRet_Ok()
        }
    )
}

export function mkRule_Union<CASES extends any[], T extends CASES[number]>(...caseRules: RuleMap<CASES>) {
    return mkRule<T>(
        data => {
            for (const caseRule of caseRules) {
                const caseReport = caseRule.check(data)
                if (isOk_Report(caseReport)) {
                    return mkValiRet_Ok()
                }
            }
            return mkValiRet_Ng() // Did not meet any of the cases.
        }
    )
}

// Expected to be used for recursive data etc.
export function mkRule_LazyEval<T>(callback: () => Rule<T>) {
    let cache: Rule<T> | null = null
    return mkRule<T>(
        data => {
            if (cache == null) {
                cache = callback()
            }
            const report = cache.check(data)
            return isOk_Report(report) ? mkValiRet_Ok() : mkValiRet_Ng()
        }
    )
}
