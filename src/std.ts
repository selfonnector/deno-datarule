import type {
    Rule,
    Validate,
    Report,
    Report_Ok,
    Report_Ng,
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

export function newRule<T>(validate: Validate<T>): Rule<T> {
    return {
        validate: validate
    }
}

export const rule_String = newRule(
    data => typeof(data) === 'string' ? newReport_Ok(data) : newReport_Ng() // Data is not string.
)
export const rule_Number = newRule(
    data => typeof(data) === 'number' ? newReport_Ok(data) : newReport_Ng() // Data is not number.
)
export const rule_Boolean = newRule(
    data => typeof(data) === 'boolean' ? newReport_Ok(data) : newReport_Ng() // Data is not boolean.
)
export const rule_Bigint = newRule(
    data => typeof(data) === 'bigint' ? newReport_Ok(data) : newReport_Ng() // Data is not bigint.
)
export const rule_Symbol = newRule(
    data => typeof(data) === 'symbol' ? newReport_Ok(data) : newReport_Ng() // Data is not symbol.
)
export const rule_Undefined = newRule(
    data => typeof(data) === 'undefined' ? newReport_Ok(data) : newReport_Ng() // Data is not undefined.
)
export const rule_Null = newRule(
    data => data == null ? newReport_Ok(data as null) : newReport_Ng() // Data is not null.
)

export function newRule_StrLit<T extends string>(value: T) {
    return newRule(
        data => {
            if (typeof(data) !== 'string') {
                return newReport_Ng() // Data is not string.
            }
            if (data !== value) {
                return newReport_Ng() // Data is not '${value}'.
            }
            return newReport_Ok(data as T)
        }
    )
}
export function newRule_NumLit<T extends number>(value: T) {
    return newRule(
        data => {
            if (typeof(data) !== 'number') {
                return newReport_Ng() // Data is not number.
            }
            if (data !== value) {
                return newReport_Ng() // Data is not ${value}.
            }
            return newReport_Ok(data as T)
        }
    )
}
function newRule_BoolLit<T extends boolean>(value: T) {
    return newRule(
        data => {
            if (typeof(data) !== 'boolean') {
                return newReport_Ng() // Data is not boolean.
            }
            if (data !== value) {
                return newReport_Ng() // Data is not ${value}.
            }
            return newReport_Ok(data as T)
        }
    )
}
export const rule_BoolTrue = newRule_BoolLit(true)
export const rule_BoolFalse = newRule_BoolLit(false)

export function newRule_Array<E, T extends E[]>(elementRule: Rule<E>) {
    return newRule(
        data => {
            if (!Array.isArray(data)) {
                return newReport_Ng() // Data is not array.
            }
            for (const elementData of data) {
                const elementReport = elementRule.validate(elementData)
                if (isNg_Report(elementReport)) {
                    return newReport_Ng() // Element data of index [${i}] is not valid.
                }
            }
            return newReport_Ok(data as T)
        }
    )
}
export function newRule_Dictionary<E, T extends Dictionary<E>>(elementRule: Rule<E>) {
    return newRule(
        data => {
            if (typeof(data) !== 'object' || data == null) {
                return newReport_Ng() // Data is not object.
            }
            for (const [, elementData] of objectEntries(data)) {
                const elementReport = elementRule.validate(elementData)
                if (isNg_Report(elementReport)) {
                    return newReport_Ng() // Element data of key [${key}] is not valid.
                }
            }
            return newReport_Ok(data as T)
        }
    )
}
export function newRule_Tuple<T extends any[]>(...elementRules: RuleMap<T>) {
    return newRule(
        data => {
            if (!Array.isArray(data)) {
                return newReport_Ng() // Data is not array.
            }
            if (data.length !== elementRules.length) {
                return newReport_Ng() // Data length is not match.
            }
            let i = 0
            for (const elementData of data) {
                const elementReport = elementRules[i].validate(elementData)
                if (isNg_Report(elementReport)) {
                    return newReport_Ng() // Element data of index [${i}] is not valid.
                }
                i++
            }
            return newReport_Ok(data as T)
        }
    )
}
export function newRule_ObjLit<OBJ,
T extends OPT extends (keyof OBJ)[] ? Optionally<OBJ, OPT[number]> : OBJ,
OPT extends (keyof OBJ)[] | undefined = undefined>(ruleMap: RuleMap<OBJ>, optionalKeys?: OPT) {
    return newRule(
        data => {
            if (typeof(data) !== 'object' || data == null) {
                return newReport_Ng() // Data is not object.
            }
            for (const [key, propertyData] of objectEntries(data)) {
                if (!objectKeyExists(ruleMap, key)) {
                    return newReport_Ng() // Property data of key [${key}] does not exist in rule.
                }
                const propertyReport = ruleMap[key].validate(propertyData)
                if (isNg_Report(propertyReport)) {
                    return newReport_Ng() // Property data of key [${key}] is not valid.
                }
            }
            if (optionalKeys) {
                for (const [key] of objectEntries(ruleMap)) {
                    if (optionalKeys.indexOf(key) >= 0) {
                        continue // Current key is optional.
                    }
                    if (!objectKeyExists(data, key)) {
                        return newReport_Ng() // Required property of key [${key}] does not exist in data.
                    }
                }
            } else {
                for (const [key] of objectEntries(ruleMap)) {
                    if (!objectKeyExists(data, key)) {
                        return newReport_Ng() // Required property of key [${key}] does not exist in data.
                    }
                }
            }
            return newReport_Ok(data as T)
        }
    )
}

export function newRule_Union<CASES extends any[], T extends CASES[number]>(...caseRules: RuleMap<CASES>) {
    return newRule(
        data => {
            for (const caseRule of caseRules) {
                const caseReport = caseRule.validate(data)
                if (isOk_Report(caseReport)) {
                    return newReport_Ok(data as T)
                }
            }
            return newReport_Ng() // Did not meet any of the cases.
        }
    )
}

// Expected to be used for recursive data etc.
export function newRule_LazyEval<T>(callback: () => Rule<T>) {
    let cache: Rule<T> | null = null
    return newRule(
        data => {
            if (cache == null) {
                cache = callback()
            }
            return cache.validate(data)
        }
    )
}

export function newReport_Ok<T>(data: T): Report_Ok<T> {
    return {
        kind: 'ok',
        data: data
    }
}
export function newReport_Ng(): Report_Ng {
    return {
        kind: 'ng'
    }
}

export function isOk_Report<T>(report: Report<T>): report is Report_Ok<T> {
    return report.kind === 'ok'
}
export function isNg_Report<T>(report: Report<T>): report is Report_Ng {
    return report.kind === 'ng'
}
