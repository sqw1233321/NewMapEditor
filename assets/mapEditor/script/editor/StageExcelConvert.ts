import { AttrCfgType, AttrCfgTypeEnum, AttrPanelPropertyType } from "../type/mapTypes";
import DynamicGetter from "./DynamicGetter/DynamicGetter";
import EditorSetting from "./EditorSetting";

//关卡表转化
export default class StageExcelConvert {
    //先将关卡表的一些字段置为空
    static setDefault(mainKey) {
        const excelDat = DynamicGetter.Ins.getExcelJson("LevelBaseConfig");
        const itemDat = excelDat[mainKey];
        if (!itemDat) return;
        const needDefaultName = ["areaItems", "baseAreaItems"];
        needDefaultName.forEach(name => {
            itemDat[name] = "";
        });
    }

    //进行一下查漏补缺
    static fillProperties(mainKey: number) {
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName.toString() == "Stage");
        if (!typeJson) return;
        const excelDat = DynamicGetter.Ins.getExcelJson("LevelBaseConfig");
        if (!excelDat[mainKey]) {
            excelDat[mainKey] = {};
        }
        const itemDat = excelDat[mainKey];
        typeJson.Properties.forEach((property: AttrPanelPropertyType) => {
            if (!itemDat[property.ClassPropertyName]) {
                const type = property.Type;
                let resultDat = property.DefaultValue;
                if (type == AttrCfgTypeEnum.object || type == AttrCfgTypeEnum.array) {
                    resultDat = "";
                }
                itemDat[property.ClassPropertyName] = resultDat;
            }
        });
        itemDat["id"] = mainKey;
    }

    //excelDat转化为单个key
    static exportExcelDatToStr(mainKey, uniqueKey: number, propertyClassName: string) {
        const excelDat = DynamicGetter.Ins.getExcelJson("LevelBaseConfig");
        const itemDat = excelDat[mainKey];
        if (!itemDat) return;
        const propertyDat = itemDat[propertyClassName];
        if (!propertyDat) return;
        let resDat;
        //特殊处理某些字段
        if (propertyClassName == "areaItems" || propertyClassName == "baseAreaItems") {
            const tempDat: string[] = [];
            propertyDat.split("|").forEach((strInfo: string) => {
                const info = strInfo.split("_");
                const roomIds = info[2];
                const allRooms = roomIds.split("&");
                const has = allRooms.includes(uniqueKey.toString());
                has && tempDat.push(`${info[0]}_${info[1]}`);
            })
            resDat = tempDat.join("|");
        }
        else {
            resDat = propertyDat;
        }
        return resDat;
    }

    static exportStrToExcelDat(uniqueKey, propertyClassName: string, strDat) {
        const excelDat = DynamicGetter.Ins.getExcelJson("LevelBaseConfig");
        const mainKey = EditorSetting.Instance.getStageId();
        const itemDat = excelDat[mainKey];
        if (!itemDat) return;
        let propertyDat = itemDat[propertyClassName];
        if (!propertyDat) {
            propertyDat = "";
        }
        let resDat;
        if (propertyClassName == "areaItems" || propertyClassName == "baseAreaItems") {
            resDat = this.addUniqueKeyToProperty(uniqueKey.toString(), strDat, propertyDat);
        }
        else {
            resDat = strDat;
        }
        return resDat;
    }

    private static addUniqueKeyToProperty(newRoomId: string, strDat: string, propertyDat: string): string {
        if (!strDat) return propertyDat;
        let newParts: string[] = [];
        if (propertyDat) {
            //删除匹配的元素（最后一个下划线包含）
            const parts = propertyDat.split("|");
            parts.forEach(part => {
                const partInfo = part.split("_");
                const partPrefix = `${partInfo[0]}_${partInfo[1]}`;
                const partRoomIds = partInfo[2].split("&");
                if (partRoomIds.includes(newRoomId)) {
                    if (partRoomIds.length > 1) {
                        newParts.push(`${partPrefix}_${partRoomIds.filter(roomId => roomId != newRoomId).join("&")}`);
                    }
                }
                else newParts.push(part);
            })
        }

        //填充
        const strInfos = strDat.split("|");
        strInfos.forEach(strInfo => {
            const prefix = strInfo;  // "1_5"
            const equalPartIndex = newParts.findIndex(part => {
                const partInfo = part.split("_");
                const partPrefix = `${partInfo[0]}_${partInfo[1]}`;
                return partPrefix == prefix;
            });
            if (equalPartIndex != -1) {
                newParts[equalPartIndex] = `${newParts[equalPartIndex]}&${newRoomId}`;
            }
            else newParts.push(`${prefix}_${newRoomId}`);
        });

        return newParts.join("|");
    }


}
