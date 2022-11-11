// To parse this data:
//
//   import { Convert, ContentTree } from "./file";
//
//   const contentTree = Convert.toContentTree(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

import { Cache } from "memory-cache";

export interface ContentTree {
    data: Data;
}

export interface Data {
    domains: Domain[];
}

export interface Domain {
    id: string;
    name: string;
    skills: Skill[];
}

export interface Skill {
    id: string;
    name: string;
    concepts: Concept[];
}

export interface Concept {
    id: string;
    name: string;
    questions: Question[];
}

export interface Question {
    id: QuestionID;
    desc: QuestionDesc;
    type: Type;
    options: Option[];
}

export enum QuestionDesc {
    ProblemOne = "Problem One",
}

export enum QuestionID {
    P1 = "P1",
}

export interface Option {
    id: OptionID;
    desc: OptionDesc;
    ordinal: Ordinal;
    is_correct: boolean;
}

export enum OptionDesc {
    OptionFour = "Option Four",
    OptionOne = "Option One",
    OptionThree = "Option Three",
    OptionTwo = "Option Two",
}

export enum OptionID {
    O1 = "O1",
    O2 = "O2",
    O3 = "O3",
    O4 = "O4",
}

export enum Ordinal {
    A = "a",
    B = "b",
    C = "c",
    D = "d",
}

export enum Type {
    Mcq = "MCQ",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toContentTree(json: string): ContentTree {
        return cast(JSON.parse(json), r("ContentTree"));
    }

    public static contentTreeToJson(value: ContentTree): string {
        return JSON.stringify(uncast(value, r("ContentTree")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`,);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) { }
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "ContentTree": o([
        { json: "data", js: "data", typ: r("Data") },
    ], false),
    "Data": o([
        { json: "domains", js: "domains", typ: a(r("Domain")) },
    ], false),
    "Domain": o([
        { json: "id", js: "id", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "skills", js: "skills", typ: a(r("Skill")) },
    ], false),
    "Skill": o([
        { json: "id", js: "id", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "concepts", js: "concepts", typ: a(r("Concept")) },
    ], false),
    "Concept": o([
        { json: "id", js: "id", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "questions", js: "questions", typ: a(r("Question")) },
    ], false),
    "Question": o([
        { json: "id", js: "id", typ: r("QuestionID") },
        { json: "desc", js: "desc", typ: r("QuestionDesc") },
        { json: "type", js: "type", typ: r("Type") },
        { json: "options", js: "options", typ: a(r("Option")) },
    ], false),
    "Option": o([
        { json: "id", js: "id", typ: r("OptionID") },
        { json: "desc", js: "desc", typ: r("OptionDesc") },
        { json: "ordinal", js: "ordinal", typ: r("Ordinal") },
        { json: "is_correct", js: "is_correct", typ: true },
    ], false),
    "QuestionDesc": [
        "Problem One",
    ],
    "QuestionID": [
        "P1",
    ],
    "OptionDesc": [
        "Option Four",
        "Option One",
        "Option Three",
        "Option Two",
    ],
    "OptionID": [
        "O1",
        "O2",
        "O3",
        "O4",
    ],
    "Ordinal": [
        "a",
        "b",
        "c",
        "d",
    ],
    "Type": [
        "MCQ",
    ],
};


export const cacheData = new Cache<string, ContentTree>();
export const cacheDataNoQ = new Cache<string, ContentTree>();