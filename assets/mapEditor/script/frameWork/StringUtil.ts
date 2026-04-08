// 转换自 assets/_script/StringUtil.js

 export class StringUtil {
  static _isEmpty(val: any): boolean {
    return val == null || val === "";
  }

  static _isAnyEmptyInternal(...vals: any[]): boolean {
    if (!vals || vals.length === 0) return true;
    for (const v of vals) {
      if (this._isEmpty(v)) return true;
    }
    return false;
  }

   static formatDescStr(
    str: string,
    map: { [key: string]: any },
    index: number,
    reg: RegExp = /\[(.*?)\]/g
  ): string {
    return str.replace(reg, (match, key) => {
      let isPercent = false;
      let realKey = key as string;
      if (realKey.includes("%")) {
        isPercent = true;
        realKey = realKey.slice(0, realKey.length - 1);
      }
      if (Object.prototype.hasOwnProperty.call(map, realKey)) {
        let val: any = map[realKey];
        if (isPercent) {
          if (typeof val === "string") {
            val = val.split("|").map(Number)[index - 1];
          }
          val *= 100;
          val = Math.round(val * 100) / 100;
          if (val % 1 === 0) {
            return Math.floor(val) + "%";
          } else {
            return val + "%";
          }
        } else {
          if (typeof val === "string") {
            val = val.split("|").map(Number)[index - 1];
          }
          return val;
        }
      }
      return match;
    });
  }

   static transRichText(str: string, color = "#69FF3A"): string {
    return (
      "<outline color=black width=1>" +
      str.replace(/(\d+%)|(\d+秒)|(\d+)/g, (m) => `<color=${color}>${m}</color>`) +
      "</color>"
    );
  }

   static isEmpty(val: any): boolean {
    return this._isEmpty(val);
  }

   static isNotEmpty(val: any): boolean {
    return !this._isEmpty(val);
  }

   static isAnyEmpty(...vals: any[]): boolean {
    return this._isAnyEmptyInternal(...vals);
  }

   static isNoneEmpty(...vals: any[]): boolean {
    return !this._isAnyEmptyInternal(...vals);
  }

   static versionCompare(a: string, b: string): number {
    const as = a.split(".");
    const bs = b.split(".");
    for (let i = 0; i < as.length; i++) {
      if (bs[i] == null) return 1;
      if (as[i] !== bs[i]) {
        return Number(as[i]) - Number(bs[i]);
      }
    }
    return 0;
  }

   static copyObj<T = any>(obj: T): T {
    const result: any =
      Object.prototype.toString.call(obj) === "[object Array]" ? [] : {};
    for (const k in obj as any) {
      const v = (obj as any)[k];
      if (v == null) {
        result[k] = v;
      } else if (typeof v === "object") {
        result[k] = this.copyObj(v);
      } else {
        result[k] = v;
      }
    }
    return result;
  }

   static strLenLimit(str: string, len = 8, suffix = "..."): string {
    let res = str;
    if (str.length > len) {
      res = str.substring(0, len) + suffix;
    }
    return res;
  }
}

 class StringBuffer {
  private _strings: string[] = [];

  append(str: string): void {
    this._strings.push(str);
  }

  toString(): string {
    return this._strings.join("");
  }
}


