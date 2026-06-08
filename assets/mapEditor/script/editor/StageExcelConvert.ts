import DynamicGetter from "./DynamicGetter/DynamicGetter";

//关卡表转化
export default class StageExcelConvert {
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

    static exportStrToExcelDat(strDat: string, mainKey, uniqueKey: number, propertyClassName: string) {
        const excelDat = DynamicGetter.Ins.getExcelJson("LevelBaseConfig");
        const itemDat = excelDat[mainKey];
        if (!itemDat) return;
        const propertyDat = itemDat[propertyClassName];
        if (!propertyDat) return;
        let resDat;
    }


}
