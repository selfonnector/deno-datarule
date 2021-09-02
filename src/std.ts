import type {
    Rule,
    Validate,
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

export function mkRule<T>(validate: Validate<T>): Rule<T> {
    return {
        validate: validate
    }
}

export function mkReport_Ok(): Report_Ok {
    return {
        kind: 'ok'
    }
}
export function mkReport_Ng(): Report_Ng {
    return {
        kind: 'ng'
    }
}

export function isOk_Report(report: Report): report is Report_Ok {
    return report.kind === 'ok'
}
export function isNg_Report(report: Report): report is Report_Ng {
    return report.kind === 'ng'
}

export const rule_String = mkRule<string>(
    data => typeof(data) === 'string' ? mkReport_Ok() : mkReport_Ng() // Data is not string.
)
export const rule_Number = mkRule<number>(
    data => typeof(data) === 'number' ? mkReport_Ok() : mkReport_Ng() // Data is not number.
)
export const rule_Boolean = mkRule<boolean>(
    data => typeof(data) === 'boolean' ? mkReport_Ok() : mkReport_Ng() // Data is not boolean.
)
export const rule_Bigint = mkRule<bigint>(
    data => typeof(data) === 'bigint' ? mkReport_Ok() : mkReport_Ng() // Data is not bigint.
)
export const rule_Symbol = mkRule<symbol>(
    data => typeof(data) === 'symbol' ? mkReport_Ok() : mkReport_Ng() // Data is not symbol.
)
export const rule_Undefined = mkRule<undefined>(
    data => typeof(data) === 'undefined' ? mkReport_Ok() : mkReport_Ng() // Data is not undefined.
)
export const rule_Null = mkRule<null>(
    data => data == null ? mkReport_Ok() : mkReport_Ng() // Data is not null.
)

export function mkRule_StrLit<T extends string>(value: T) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'string') {
                return mkReport_Ng() // Data is not string.
            }
            if (data !== value) {
                return mkReport_Ng() // Data is not '${value}'.
            }
            return mkReport_Ok()
        }
    )
}
export function mkRule_NumLit<T extends number>(value: T) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'number') {
                return mkReport_Ng() // Data is not number.
            }
            if (data !== value) {
                return mkReport_Ng() // Data is not ${value}.
            }
            return mkReport_Ok()
        }
    )
}
function mkRule_BoolLit<T extends boolean>(value: T) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'boolean') {
                return mkReport_Ng() // Data is not boolean.
            }
            if (data !== value) {
                return mkReport_Ng() // Data is not ${value}.
            }
            return mkReport_Ok()
        }
    )
}
export const rule_BoolTrue = mkRule_BoolLit(true)
export const rule_BoolFalse = mkRule_BoolLit(false)

export function mkRule_Array<E, T extends E[]>(elementRule: Rule<E>) {
    return mkRule<T>(
        data => {
            if (!Array.isArray(data)) {
                return mkReport_Ng() // Data is not array.
            }
            for (const elementData of data) {
                const elementReport = elementRule.validate(elementData)
                if (isNg_Report(elementReport)) {
                    return mkReport_Ng() // Element data of index [${i}] is not valid.
                }
            }
            return mkReport_Ok()
        }
    )
}
export function mkRule_Dictionary<E, T extends Dictionary<E>>(elementRule: Rule<E>) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'object' || data == null) {
                return mkReport_Ng() // Data is not object.
            }
            for (const [, elementData] of objectEntries(data)) {
                const elementReport = elementRule.validate(elementData)
                if (isNg_Report(elementReport)) {
                    return mkReport_Ng() // Element data of key [${key}] is not valid.
                }
            }
            return mkReport_Ok()
        }
    )
}
export function mkRule_Tuple<T extends any[]>(...elementRules: RuleMap<T>) {
    return mkRule<T>(
        data => {
            if (!Array.isArray(data)) {
                return mkReport_Ng() // Data is not array.
            }
            if (data.length !== elementRules.length) {
                return mkReport_Ng() // Data length is not match.
            }
            let i = 0
            for (const elementData of data) {
                const elementReport = elementRules[i].validate(elementData)
                if (isNg_Report(elementReport)) {
                    return mkReport_Ng() // Element data of index [${i}] is not valid.
                }
                i++
            }
            return mkReport_Ok()
        }
    )
}
export function mkRule_ObjLit<OBJ,
T extends OPT extends (keyof OBJ)[] ? Optionally<OBJ, OPT[number]> : OBJ,
OPT extends (keyof OBJ)[] | undefined = undefined>(ruleMap: RuleMap<OBJ>, optionalKeys?: OPT) {
    return mkRule<T>(
        data => {
            if (typeof(data) !== 'object' || data == null) {
                return mkReport_Ng() // Data is not object.
            }
            for (const [key, propertyData] of objectEntries(data)) {
                if (!objectKeyExists(ruleMap, key)) {
                    return mkReport_Ng() // Property data of key [${key}] does not exist in rule.
                }
                const propertyReport = ruleMap[key].validate(propertyData)
                if (isNg_Report(propertyReport)) {
                    return mkReport_Ng() // Property data of key [${key}] is not valid.
                }
            }
            if (optionalKeys) {
                for (const [key] of objectEntries(ruleMap)) {
                    if (optionalKeys.indexOf(key) >= 0) {
                        continue // Current key is optional.
                    }
                    if (!objectKeyExists(data, key)) {
                        return mkReport_Ng() // Required property of key [${key}] does not exist in data.
                    }
                }
            } else {
                for (const [key] of objectEntries(ruleMap)) {
                    if (!objectKeyExists(data, key)) {
                        return mkReport_Ng() // Required property of key [${key}] does not exist in data.
                    }
                }
            }
            return mkReport_Ok()
        }
    )
}

export function mkRule_Union<CASES extends any[], T extends CASES[number]>(...caseRules: RuleMap<CASES>) {
    return mkRule<T>(
        data => {
            for (const caseRule of caseRules) {
                const caseReport = caseRule.validate(data)
                if (isOk_Report(caseReport)) {
                    return mkReport_Ok()
                }
            }
            return mkReport_Ng() // Did not meet any of the cases.
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
            return cache.validate(data)
        }
    )
}

export function meet<T>(rule: Rule<T>, data: any): data is T {
    return isOk_Report(rule.validate(data))
}
