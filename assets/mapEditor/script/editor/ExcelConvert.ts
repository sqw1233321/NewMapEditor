// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { AttrCfgType, UnitType, AttrPanelPropertyType, AttrCfgTypeEnum } from "../type/mapTypes";
import DynamicGetter from "./DynamicGetter/DynamicGetter";
import EditorSetting from "./EditorSetting";
import StageExcelConvert from "./StageExcelConvert";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExcelConvert extends cc.Component {

    //传入原始数据，并且补上属性描述中的excel数据str格式
    public static addExcelStrDat(dat, uniqueKey, unitType: UnitType) {
        let resDat = {};
        Object.keys(dat).forEach((key) => {
            resDat[key] = dat[key];
        });
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == unitType);
        if (typeJson) {
            typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
                if (!p.ExcelName) return;
                //已经有这个字段了就不覆盖了
                if (resDat[p.ClassPropertyName]) return;
                const excelName = p.ExcelName;
                const excelDat = DynamicGetter.Ins.getExcelJson(excelName);
                if (!excelDat) return;
                const isStageExcel = this.getIsStageExcel(excelName);
                const key = isStageExcel ? EditorSetting.Instance.getStageId() : uniqueKey;
                const dat = excelDat[key];
                if (!dat) return;
                const propertyDat = dat[`${p.ClassPropertyName}`];
                if (propertyDat == null || propertyDat == "") return;
                //解析字段内容
                resDat[p.ClassPropertyName] = propertyDat;
            });
        }
        return resDat;
    }

    //传入原始数据，并且补上属性描述中的excel数据，obj格式
    public static addExcelEditDat(dat, uniqueKey, unitType: UnitType) {
        let resDat = {};
        Object.keys(dat).forEach((key) => {
            resDat[key] = dat[key];
        });
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == unitType);
        if (typeJson) {
            typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
                if (!p.ExcelName) return;
                //已经有这个字段了就不覆盖了
                if (resDat[p.ClassPropertyName]) return;
                const excelName = p.ExcelName;
                const excelDat = DynamicGetter.Ins.getExcelJson(excelName);
                if (!excelDat) return;
                const isStageExcel = this.getIsStageExcel(excelName);
                const key = isStageExcel ? EditorSetting.Instance.getStageId() : uniqueKey;
                const dat = excelDat[key];
                if (!dat) return;
                let propertyDat = dat[`${p.ClassPropertyName}`];
                if (propertyDat == null || propertyDat == "") return;
                //解析字段内容
                if (isStageExcel) {
                    //关卡表的特殊解析字段
                    const mainKey = EditorSetting.Instance.getStageId();
                    propertyDat = StageExcelConvert.exportExcelDatToStr(mainKey, uniqueKey, p.ClassPropertyName);
                }
                resDat[p.ClassPropertyName] = this.parseObj(propertyDat, p);
            });
        }
        return resDat;
    }

    //获取导出excel数据，传入的是编辑数据（存在引用类型）
    public static getExportExcelDatByEditDat(exportDat, uniqueKey, unitType): { excelName: string, id: number, itemName: string, itemValue: any }[] {
        let dat = {}
        //筛选出在excel中的数据
        Object.keys(exportDat).forEach((key) => {
            if (!this.isPorperTyExcel(key, unitType)) return;
            dat[key] = exportDat[key];
        });
        const resDat: { excelName: string, id: number, itemName: string, itemValue: any }[] = [];
        Object.keys(dat).forEach((key) => {
            const properTy = DynamicGetter.Ins.getAttrSetting().typeArr.find((t: AttrCfgType) => t.ClassName == unitType).Properties.find((p: AttrPanelPropertyType) => p.ClassPropertyName == key);
            if (!properTy) return;
            const itemValue = this.objToString(dat[key], properTy);
            resDat.push({
                excelName: properTy.ExcelName,
                id: uniqueKey,
                itemName: key,
                itemValue: itemValue
            });
        });
        return resDat;
    }

    //获取导出excel数据，传入的是str数据（不存在引用类型）
    public static getExportExcelDatByStrDat(strDat, uniqueKey, unitType) {
        let dat = {}
        //筛选出在excel中的数据
        Object.keys(strDat).forEach((key) => {
            if (!this.isPorperTyExcel(key, unitType)) return;
            dat[key] = strDat[key];
        });
        const resDat: { excelName: string, id: number, itemName: string, itemValue: any }[] = [];
        Object.keys(dat).forEach((key) => {
            const properTy = DynamicGetter.Ins.getAttrSetting().typeArr.find((t: AttrCfgType) => t.ClassName == unitType).Properties.find((p: AttrPanelPropertyType) => p.ClassPropertyName == key);
            if (!properTy) return;
            const itemValue = dat[key];
            resDat.push({
                excelName: properTy.ExcelName,
                id: uniqueKey,
                itemName: key,
                itemValue: itemValue
            });
        });
        return resDat;
    }

    //str转化为obj
    static parseObj(excelStr: string, p: AttrPanelPropertyType): any {
        const isArr = p.Type == AttrCfgTypeEnum.array || p.Type == AttrCfgTypeEnum.object;
        if (!isArr) {
            if (p.Type == AttrCfgTypeEnum.number || p.Type == AttrCfgTypeEnum.dropDownNumber) return Number(excelStr);
            if (p.Type == AttrCfgTypeEnum.string || p.Type == AttrCfgTypeEnum.dropDownString) return excelStr;
            if (p.Type == AttrCfgTypeEnum.booleanType) return excelStr == "true";
            if (p.Type == AttrCfgTypeEnum.booleanNumber) return Number(excelStr) == 1;
        }
        const splitSymbol = p.Split;
        if (!splitSymbol) return;
        let res;
        let datArr = excelStr ? excelStr.split(splitSymbol) : [];
        if (p.Type == AttrCfgTypeEnum.array) {
            res = []
            datArr.forEach((dat) => {
                res.push(this.parseObj(dat, p.Properties[0]));
            })
        }
        if (p.Type == AttrCfgTypeEnum.object) {
            res = {}
            //字段的个数
            const PropertyLength = p.Properties.length;
            const diff = datArr.length - PropertyLength;
            if (diff > 0) {
                // 多余部分合并到最后一个字段
                const lastDat = datArr.slice(PropertyLength - 1).join(p.Split);
                datArr[PropertyLength - 1] = lastDat;
                datArr = datArr.slice(0, PropertyLength);
            }
            //对象字段的个数
            p.Properties.forEach((property, index) => {
                const dat = datArr[index] ?? property.DefaultValue;
                res[property.ClassPropertyName] = this.parseObj(dat, property);
            })
        }
        return res;
    }

    //obj转化为str
    static objToString(data: any, p: AttrPanelPropertyType): any {
        if (!data) {
            const type = p.Type;
            if (type == AttrCfgTypeEnum.object || type == AttrCfgTypeEnum.array) {
                return "";
            }
            return p.DefaultValue;
        }
        const isCompositeType = p.Type === AttrCfgTypeEnum.array || p.Type === AttrCfgTypeEnum.object;
        if (!isCompositeType) {
            if (p.Type === AttrCfgTypeEnum.number || p.Type == AttrCfgTypeEnum.dropDownNumber) return Number(data);
            if (p.Type === AttrCfgTypeEnum.string || p.Type == AttrCfgTypeEnum.dropDownString) return data;
            if (p.Type === AttrCfgTypeEnum.booleanType) return data === true;
            if (p.Type === AttrCfgTypeEnum.booleanNumber) return Number(data);
        }
        if (p.Type === AttrCfgTypeEnum.array) {
            const subP = p.Properties[0];
            const res = (data as any[]).map(item => this.objToString(item, subP)).join(p.Split);
            return res;
        }
        if (p.Type === AttrCfgTypeEnum.object) {
            const res = p.Properties
                .map((prop: AttrPanelPropertyType) => this.objToString(data[prop.ClassPropertyName], prop))
                .join(p.Split);
            return res;
        }
    }

    //当前属性名是否是excel数据
    static isPorperTyExcel(propertyClassName: string, unitType: UnitType) {
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == unitType);
        if (!typeJson) return false;
        const propertise = typeJson.Properties as AttrPanelPropertyType[];
        return propertise.some((p: AttrPanelPropertyType) => p.ClassPropertyName == propertyClassName && p.ExcelName);
    }

    //是否关联的是关卡表
    static getIsStageExcel(excelName: string) {
        const stageKey = ["LevelBaseConfig"];
        return stageKey.includes(excelName);
    }

}
