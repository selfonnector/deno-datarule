export interface Rule<T> {
    readonly validate: Validate<T>
}

// For the type argument "_T", specify the type of "data" when returning "Report_Ok".
export type Validate<_T> = (data: any) => Report

export type Report = Report_Ok | Report_Ng
export interface Report_Ok {
    readonly kind: 'ok'
}
export interface Report_Ng {
    readonly kind: 'ng'
}

export type Type<R extends Rule<any>> = R extends Rule<infer T> ? T : never
