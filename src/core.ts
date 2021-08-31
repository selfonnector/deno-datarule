export interface Rule<T> {
    readonly meet: Meet<T>
    readonly pass: Pass<T>
    readonly check: Check<T>
}

export type Meet<T> = (data: any) => data is T
export type Pass<T> = (data: any) => T
export type Check<T> = (data: any) => Report<T>

export type Report<T> = Report_Ok<T> | Report_Ng
export interface Report_Ok<T> {
    readonly kind: 'ok'
    readonly data: T
}
export interface Report_Ng {
    readonly kind: 'ng'
}

export type Type<R extends Rule<any>> = R extends Rule<infer T> ? T : never
