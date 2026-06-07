// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { AttrCfgType, UnitType, AttrPanelPropertyType, AttrCfgTypeEnum } from "../type/mapTypes";
import DynamicGetter from "./DynamicGetter/DynamicGetter";
import EditorSetting from "./EditorSetting";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExcelConvert extends cc.Component {

    //对当前数据中的excel数据进行转化，转化成编辑数据
    public static handlerExcelDat(dat, uniqueKey, unitType: UnitType) {
        let resDat = {};
        Object.keys(dat).forEach((key) => {
            resDat[key] = dat[key];
        });
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == unitType);
        if (typeJson) {
            typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
                if (!p.ExcelName) return;
                const excelName = p.ExcelName;
                const excelDat = DynamicGetter.Ins.getExcelJson(excelName);
                if (!excelDat) return;
                const mainKey = this.getMainKey(excelName, uniqueKey);
                this.setExcelDat(resDat, excelDat, mainKey, p);
            });
        }
        return resDat;
    }

    public static convertExcelToEdit(dat, uniqueKey, unitType: UnitType) {
        let resDat = {};
        Object.keys(dat).forEach((key) => {
            resDat[key] = dat[key];
        });
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == unitType);
        if (typeJson) {
            typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
                if (!p.ExcelName) return;
                const datStr = dat[p.ClassPropertyName];
                const itemValue = this.parseObj(datStr, p);
                resDat[p.ClassPropertyName] = itemValue;
            });
        }
        return resDat;
    }

    //将编辑数据转化为excel数据
    public static convertEditToExcel(dat, uniqueKey, unitType: UnitType) {
        let resDat = {};
        Object.keys(dat).forEach((key) => {
            resDat[key] = dat[key];
        });
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == unitType);
        if (typeJson) {
            typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
                if (!p.ExcelName) return;
                const datValue = dat[p.ClassPropertyName] ?? p.DefaultValue
                const itemValue = this.objToString(datValue, p);
                resDat[p.ClassPropertyName] = itemValue;
            });
        }
        return resDat;
    }

    //获取导出excel数据
    public static getExportExcelDat(exportDat, uniqueKey, unitType): { excelName: string, id: number, itemName: string, itemValue: any }[] {
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
            const mainKey = this.getMainKey(properTy.ExcelName, uniqueKey);
            resDat.push({
                excelName: properTy.ExcelName,
                id: mainKey,
                itemName: key,
                itemValue: itemValue
            });
        });
        return resDat;
    }

    private static setExcelDat(resDat, excelDat, key, p: AttrPanelPropertyType) {
        const dat = excelDat[`${key}`];
        if (!dat) return;
        const propertyDat = dat[`${p.ClassPropertyName}`];
        if (propertyDat == null || propertyDat == "") return;
        //解析字段内容
        resDat[p.ClassPropertyName] = this.parseObj(propertyDat, p);
    }

    private static parseObj(excelStr: string, p: AttrPanelPropertyType): any {
        const isArr = p.Type == AttrCfgTypeEnum.array || p.Type == AttrCfgTypeEnum.object;
        if (!isArr) {
            if (p.Type == AttrCfgTypeEnum.number || p.Type == AttrCfgTypeEnum.dropDownNumber) return Number(excelStr);
            if (p.Type == AttrCfgTypeEnum.string || p.Type == AttrCfgTypeEnum.dropDownString) return excelStr;
            if (p.Type == AttrCfgTypeEnum.boolean) return Number(excelStr) == 1;
        }
        const splitSymbol = p.Split;
        if (!splitSymbol) return;
        let res;
        const datArr = excelStr ? excelStr.split(splitSymbol) : p.DefaultValue;
        if (p.Type == AttrCfgTypeEnum.array) {
            res = []
            datArr.forEach((dat) => {
                res.push(this.parseObj(dat, p.Properties[0]));
            })
        }
        if (p.Type == AttrCfgTypeEnum.object) {
            res = {}
            datArr.forEach((dat, index) => {
                res[p.Properties[index].ClassPropertyName] = this.parseObj(dat, p.Properties[index]);
            })
        }
        return res;
    }

    private static objToString(data: any, p: AttrPanelPropertyType): any {
        const isCompositeType = p.Type === AttrCfgTypeEnum.array || p.Type === AttrCfgTypeEnum.object;
        if (!isCompositeType) {
            if (p.Type === AttrCfgTypeEnum.number || p.Type == AttrCfgTypeEnum.dropDownNumber) return Number(data);
            if (p.Type === AttrCfgTypeEnum.string || p.Type == AttrCfgTypeEnum.dropDownString) return data;
            if (p.Type === AttrCfgTypeEnum.boolean) return data === "true";
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

    //以房间还是地图id为主键
    private static getMainKey(excelName: string, unqiueKey) {
        const stageId = EditorSetting.Instance.getStageId();
        //以地图id为key的表
        const stageKey = ["LevelBaseConfig"];
        //地图的表
        let mainKey = -1;
        if (stageKey.includes(excelName)) {
            mainKey = stageId;
        }
        //房间的表
        else {
            mainKey = unqiueKey;
        }
        return mainKey;
    }

}
