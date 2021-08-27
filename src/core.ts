export interface Rule<T> {
    readonly validate: Validate<T>
}

export type Validate<T> = (data: any) => Report<T>

export type Report<T> = ReportOk<T> | ReportNg
export interface ReportOk<T> {
    readonly kind: 'ok'
    readonly data: T
}
export interface ReportNg {
    readonly kind: 'ng'
}

export type Type<R extends Rule<any>> = R extends Rule<infer T> ? T : never
