import type {
    Rule,
    Validate,
    Report,
    ReportOk,
    ReportNg,
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
    data => typeof(data) === 'string' ? reportOk(data) : reportNg() // Data is not string.
)
export const rule_Number = newRule(
    data => typeof(data) === 'number' ? reportOk(data) : reportNg() // Data is not number.
)
export const rule_Boolean = newRule(
    data => typeof(data) === 'boolean' ? reportOk(data) : reportNg() // Data is not boolean.
)
export const rule_Bigint = newRule(
    data => typeof(data) === 'bigint' ? reportOk(data) : reportNg() // Data is not bigint.
)
export const rule_Symbol = newRule(
    data => typeof(data) === 'symbol' ? reportOk(data) : reportNg() // Data is not symbol.
)
export const rule_Undefined = newRule(
    data => typeof(data) === 'undefined' ? reportOk(data) : reportNg() // Data is not undefined.
)
export const rule_Null = newRule(
    data => data == null ? reportOk(data as null) : reportNg() // Data is not null.
)

export function newRule_StrLit<T extends string>(value: T) {
    return newRule(
        data => {
            if (typeof(data) !== 'string') {
                return reportNg() // Data is not string.
            }
            if (data !== value) {
                return reportNg() // Data is not '${value}'.
            }
            return reportOk(data as T)
        }
    )
}
export function newRule_NumLit<T extends number>(value: T) {
    return newRule(
        data => {
            if (typeof(data) !== 'number') {
                return reportNg() // Data is not number.
            }
            if (data !== value) {
                return reportNg() // Data is not ${value}.
            }
            return reportOk(data as T)
        }
    )
}
function newRule_BoolLit<T extends boolean>(value: T) {
    return newRule(
        data => {
            if (typeof(data) !== 'boolean') {
                return reportNg() // Data is not boolean.
            }
            if (data !== value) {
                return reportNg() // Data is not ${value}.
            }
            return reportOk(data as T)
        }
    )
}
export const rule_BoolTrue = newRule_BoolLit(true)
export const rule_BoolFalse = newRule_BoolLit(false)

export function newRule_Array<E, T extends E[]>(elementRule: Rule<E>) {
    return newRule(
        data => {
            if (!Array.isArray(data)) {
                return reportNg() // Data is not array.
            }
            for (const elementData of data) {
                const elementReport = elementRule.validate(elementData)
                if (isReportNg(elementReport)) {
                    return reportNg() // Element data of index [${i}] is not valid.
                }
            }
            return reportOk(data as T)
        }
    )
}
export function newRule_Dictionary<E, T extends Dictionary<E>>(elementRule: Rule<E>) {
    return newRule(
        data => {
            if (typeof(data) !== 'object' || data == null) {
                return reportNg() // Data is not object.
            }
            for (const [, elementData] of objectEntries(data)) {
                const elementReport = elementRule.validate(elementData)
                if (isReportNg(elementReport)) {
                    return reportNg() // Element data of key [${key}] is not valid.
                }
            }
            return reportOk(data as T)
        }
    )
}
export function newRule_Tuple<T extends any[]>(...elementRules: RuleMap<T>) {
    return newRule(
        data => {
            if (!Array.isArray(data)) {
                return reportNg() // Data is not array.
            }
            if (data.length !== elementRules.length) {
                return reportNg() // Data length is not match.
            }
            let i = 0
            for (const elementData of data) {
                const elementReport = elementRules[i].validate(elementData)
                if (isReportNg(elementReport)) {
                    return reportNg() // Element data of index [${i}] is not valid.
                }
                i++
            }
            return reportOk(data as T)
        }
    )
}
export function newRule_ObjLit<OBJ,
T extends OPT extends (keyof OBJ)[] ? Optionally<OBJ, OPT[number]> : OBJ,
OPT extends (keyof OBJ)[] | undefined = undefined>(ruleMap: RuleMap<OBJ>, optionalKeys?: OPT) {
    return newRule(
        data => {
            if (typeof(data) !== 'object' || data == null) {
                return reportNg() // Data is not object.
            }
            for (const [key, propertyData] of objectEntries(data)) {
                if (!objectKeyExists(ruleMap, key)) {
                    return reportNg() // Property data of key [${key}] does not exist in rule.
                }
                const propertyReport = ruleMap[key].validate(propertyData)
                if (isReportNg(propertyReport)) {
                    return reportNg() // Property data of key [${key}] is not valid.
                }
            }
            if (optionalKeys) {
                for (const [key] of objectEntries(ruleMap)) {
                    if (optionalKeys.indexOf(key) >= 0) {
                        continue // Current key is optional.
                    }
                    if (!objectKeyExists(data, key)) {
                        return reportNg() // Required property of key [${key}] does not exist in data.
                    }
                }
            } else {
                for (const [key] of objectEntries(ruleMap)) {
                    if (!objectKeyExists(data, key)) {
                        return reportNg() // Required property of key [${key}] does not exist in data.
                    }
                }
            }
            return reportOk(data as T)
        }
    )
}

export function newRule_Union<CASES extends any[], T extends CASES[number]>(...caseRules: RuleMap<CASES>) {
    return newRule(
        data => {
            for (const caseRule of caseRules) {
                const caseReport = caseRule.validate(data)
                if (isReportOk(caseReport)) {
                    return reportOk(data as T)
                }
            }
            return reportNg() // Did not meet any of the cases.
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

export function reportOk<T>(data: T): ReportOk<T> {
    return {
        kind: 'ok',
        data: data
    }
}
export function reportNg(): ReportNg {
    return {
        kind: 'ng'
    }
}

export function isReportOk<T>(report: Report<T>): report is ReportOk<T> {
    return report.kind === 'ok'
}
export function isReportNg<T>(report: Report<T>): report is ReportNg {
    return report.kind === 'ng'
}
