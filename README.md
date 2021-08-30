# Deno module to support data rule making

## Example

### Basic

```typescript
import {
    rule_String,
    rule_Number,
    mkRule_StrLit,
    mkRule_ObjLit,
    mkRule_Union,
    isOk_Report
} from './mod.ts'

const rule_StrOrNum = mkRule_Union(
    mkRule_ObjLit({
        type: mkRule_StrLit('str'),
        strValue: rule_String
    }),
    mkRule_ObjLit({
        type: mkRule_StrLit('num'),
        numValue: rule_Number
    })
)
/*
    ${ rule_StrOrNum } type is Rule<{
        type: "str";
        strValue: string;
    } | {
        type: "num";
        numValue: number;
    }>
*/
const report_A = rule_StrOrNum.validate({ type: 'str', strValue: 'abc' })
console.log(report_A) // { kind: "ok", data: { type: "str", strValue: "abc" } }
if (isOk_Report(report_A)) {
/*
    ${ report_A.data } type is {
        type: "str";
        strValue: string;
    } | {
        type: "num";
        numValue: number;
    }
*/
}

const report_B = rule_StrOrNum.validate({ type: 'num', numValue: 123 })
console.log(report_B) // { kind: "ok", data: { type: "num", numValue: 123 } }

const report_C = rule_StrOrNum.validate({ type: 'str', numValue: 123 })
console.log(report_C) // { kind: "ng" }
```

### Infer type from rules

```typescript
import { Type } from './types.ts'
import {
    rule_String,
    mkRule_Tuple,
} from './mod.ts'

const rule_StrPair = mkRule_Tuple(rule_String, rule_String)
type StrPair = Type<typeof rule_StrPair>
// type StrPair = [string, string]
```

### Recursive type

```typescript
import type { Rule } from './types.ts'
import {
    mkRule_ObjLit,
    mkRule_LazyEval
} from './mod.ts'

// For recursive type, define manually
type LoopNest = { nest?: LoopNest }

function mkRule_LoopNest(): Rule<LoopNest> {
    return mkRule_ObjLit({
        nest: mkRule_LazyEval(mkRule_LoopNest)
    }, ['nest'])
}
const rule_LoopNest = mkRule_LoopNest()

const report_A = rule_LoopNest.validate({ nest: { nest: {} } })
console.log(report_A) // { kind: "ok", data: { nest: { nest: {} } } }

const report_B = rule_LoopNest.validate({ nest: { nest: 'abc' } })
console.log(report_B) // { kind: "ng" }
```

### Add your own rules

```typescript
import {
    mkRule,
    mkRule_Array,
    mkReport_Ok,
    mkReport_Ng
} from './mod.ts'

const rule_Char = mkRule(
    data => {
        if (typeof(data) !== 'string') {
            return mkReport_Ng()
        }
        if (data.length !== 1) {
            return mkReport_Ng()
        }
        return mkReport_Ok(data as string)
    }
)
const rule_CharArray = mkRule_Array(rule_Char)

const report_A = rule_CharArray.validate(['a', 'b', 'c'])
console.log(report_A) // { kind: "ok", data: [ "a", "b", "c" ] }

const report_B = rule_CharArray.validate(['a', 'b', 'cd'])
console.log(report_B) // { kind: "ng" }
```

## Future possibilities

- Adding a "description" property to the "Rule" interface
- Adding a "message" property to the "Report_Ng" interface

Pending as it may be extra.
