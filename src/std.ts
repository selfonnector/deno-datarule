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

export function rule<T>(validate: Validate<T>): Rule<T> {
    return {
        validate: validate
    }
}

export const ruleString = rule(
    data => typeof(data) === 'string' ? reportOk(data) : reportNg() // Data is not string.
)
export const ruleNumber = rule(
    data => typeof(data) === 'number' ? reportOk(data) : reportNg() // Data is not number.
)
export const ruleBoolean = rule(
    data => typeof(data) === 'boolean' ? reportOk(data) : reportNg() // Data is not boolean.
)
export const ruleBigint = rule(
    data => typeof(data) === 'bigint' ? reportOk(data) : reportNg() // Data is not bigint.
)
export const ruleSymbol = rule(
    data => typeof(data) === 'symbol' ? reportOk(data) : reportNg() // Data is not symbol.
)
export const ruleUndefined = rule(
    data => typeof(data) === 'undefined' ? reportOk(data) : reportNg() // Data is not undefined.
)
export const ruleNull = rule(
    data => data == null ? reportOk(data as null) : reportNg() // Data is not null.
)

export function ruleStringLiteral<T extends string>(value: T) {
    return rule(
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
export function ruleNumberLiteral<T extends number>(value: T) {
    return rule(
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
function ruleBooleanLiteral<T extends boolean>(value: T) {
    return rule(
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
export const ruleBooleanTrue = ruleBooleanLiteral(true)
export const ruleBooleanFalse = ruleBooleanLiteral(false)

export function ruleArray<E, T extends E[]>(elementRule: Rule<E>) {
    return rule(
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
export function ruleDictionary<E, T extends Dictionary<E>>(elementRule: Rule<E>) {
    return rule(
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
export function ruleTuple<T extends any[]>(...elementRules: RuleMap<T>) {
    return rule(
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
export function ruleObjectLiteral<OBJ,
T extends OPT extends (keyof OBJ)[] ? Optionally<OBJ, OPT[number]> : OBJ,
OPT extends (keyof OBJ)[] | undefined = undefined>(ruleMap: RuleMap<OBJ>, optionalKeys?: OPT) {
    return rule(
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

export function ruleUnion<CASES extends any[], T extends CASES[number]>(...caseRules: RuleMap<CASES>) {
    return rule(
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
export function ruleLazyEvaluation<T>(callback: () => Rule<T>) {
    let cache: Rule<T> | null = null
    return rule(
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
