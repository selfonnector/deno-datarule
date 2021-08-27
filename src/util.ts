import type { Rule } from './core.ts'

export type RuleMap<T> = {
    [P in keyof T]: Rule<T[P]>
}

export type Optionally<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Dictionary<E> = {
    [key: string]: E
}

export type StringKey<T> = keyof T & string

export function objectKeyExists<T>(o: T, key: string): key is StringKey<T> {
    return Object.keys(o).indexOf(key) >= 0
}
export function objectEntries<T>(o: T) {
    return Object.entries(o) as [StringKey<T>, any][]
}
