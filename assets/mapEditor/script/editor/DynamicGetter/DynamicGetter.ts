import { AttrCfgDropDownType } from "../../type/mapTypes";
import EditorSetting from "../EditorSetting";
import ExcelConvert from "../ExcelConvert";
import StageExcelConvert from "../StageExcelConvert";

const { ccclass, property } = cc._decorator;

//动态json获取（TODO:后续这些json会放到外壳中，获取外部生成的接送）
@ccclass
export default class DynamicGetter extends cc.Component {
    @property(cc.SpriteFrame)
    defaultSp: cc.SpriteFrame;

    static Ins: DynamicGetter

    //所有的外部json
    allExcelJson: {
        jsonName: string;
        jsonAsset: cc.JsonAsset;
    }[] = [];

    protected onLoad(): void {
        DynamicGetter.Ins = this;
    }

    //==========图片相关=================
    //获取默认图片
    public getDefaultSp(): cc.SpriteFrame {
        return this.defaultSp;
    }

    public getSprite(iconPath: string): Promise<cc.SpriteFrame> {
        return new Promise((resolve, reject) => {
            cc.resources.load(iconPath, cc.SpriteFrame, null, (err, spriteFrame) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(spriteFrame);
                }
            });
        });
    }

    //加载动态json
    public async loadDynamicJson() {
        let loadDir;
        this.allExcelJson = [];
        //debug模式使用resource加载
        if (!CC_BUILD) {
            loadDir = (dir: string): Promise<cc.JsonAsset[]> => {
                return new Promise((resolve, reject) => {
                    cc.resources.loadDir(dir, cc.JsonAsset, (err, assets) => {
                        if (err) {
                            console.error(`[DynamicGetter] 加载 ${dir} 失败:`, err);
                            reject(err);
                            return;
                        }
                        resolve(assets);
                    });
                });
            };
        }
        //node运行使用node加载
        else {
            loadDir = (dir: string): Promise<cc.JsonAsset[]> => {
                return new Promise((resolve, reject) => {
                    window.electronAPI.readFolder(dir).then((result) => {
                        if (!result.success) {
                            console.warn(`[DynamicGetter] ${dir} 加载失败:`, result.error);
                            return false;
                        }
                        resolve(result.data);
                    });
                });
            };
        }
        try {
            const [editorAssets, outerAssets] = await Promise.all([
                loadDir(EditorSetting.EditorJsonPath),
                loadDir(EditorSetting.OuterJsonPath),
            ]);
            editorAssets.forEach((asset => {
                this[asset.name] = asset.json;
            }))
            outerAssets.forEach((asset) => {
                this.allExcelJson.push({
                    jsonName: asset.name,
                    jsonAsset: asset.json,
                });
            });
        } catch (err) {
            console.error('[DynamicGetter] 加载失败:', err);
        }
    }

    //========加载引擎内部json的读写方法=========
    //获取属性配置
    public getAttrSetting(): any {
        return this["attrSetting"];
    }

    //获取机制配置
    public getItemSetting(): any {
        return this["itemSetting"];
    }

    //获取下拉框
    public getDropDownSetting(): any {
        return this["dropDownSetting"];
    }

    //获取编辑器配置
    public getEditorSetting(): any {
        return this["editorSetting"];
    }



    public getItemSettingByUnitType(unitType: string, uniqueType: number = -1) {
        const hasType = uniqueType >= 0;
        const settings = DynamicGetter.Ins.getItemSetting();
        const setting = settings.find((t: any) => {
            let res = t.ClassName === unitType;
            if (hasType) {
                res &&= t.uniqueType === uniqueType;
            }
            return res;
        });
        return setting;
    }

    public getItemSettingByExportName(exportName: string, uniqueType: number = -1) {
        const hasType = uniqueType >= 0;
        const settings = DynamicGetter.Ins.getItemSetting();
        const setting = settings.find((t: any) => {
            let res = t.ExportName === exportName;
            if (hasType) {
                res &&= t.uniqueType === uniqueType;
            }
            return res;
        });
        return setting;
    }

    public getItemAnchor(unitType: string) {
        const settings = DynamicGetter.Ins.getItemSetting();
        const setting = settings.find((t: any) => t.ClassName === unitType);
        if (setting) {
            return setting.itemAnchor;
        }
        return [0.5, 0.5];
    }

    public getGroupIndex(unitType: string) {
        const settings = DynamicGetter.Ins.getItemSetting();
        const setting = settings.find((t: any) => t.ClassName === unitType);
        if (setting) {
            return setting.cameraGroupIndex;
        }
        return 0;
    }

    public getExportNameByUnitType(unitType: string) {
        const settings = DynamicGetter.Ins.getItemSetting();
        const setting = settings.find((t: any) => t.ClassName === unitType);
        if (setting) {
            return setting.ExportName;
        }
        return "";
    }

    public getUnitTypeByExportName(exportName: string, uniqueType: number = -1) {
        const hasType = uniqueType >= 0;
        const settings = DynamicGetter.Ins.getItemSetting();
        const setting = settings.find((t: any) => {
            let res = t.ExportName === exportName;
            //有type还要判断type是否相等
            if (hasType) {
                res &&= t.uniqueType === uniqueType;
            }
            return res;
        });
        if (setting) {
            return setting.ClassName;
        }
        return "";
    }

    //获取下拉框配置
    public getDropSettingByName(propertiesName: string): AttrCfgDropDownType[] {
        const settings = DynamicGetter.Ins.getDropDownSetting();
        const setting = settings[`${propertiesName}`];
        if (setting) {
            return setting;
        }
        return null;
    }

    //根据值取下拉框类型
    public getDropSettingIntemByValue(settings: AttrCfgDropDownType[], value): AttrCfgDropDownType {
        //注意string和number
        const item = settings.find((t: AttrCfgDropDownType) => t.exportValue === value);
        if (item) {
            return item;
        }
        return null;
    }

    //==============外部json的读写====================

    public getExcelJson(jsonName: string) {
        return this.allExcelJson.find(jsonItem => jsonItem.jsonName == jsonName)?.jsonAsset ?? "";
    }

    public setExcelJson(jsonName: string, jsonData: any) {
        let jsonItem = this.allExcelJson.find(jsonItem => jsonItem.jsonName == jsonName);
        if (!jsonItem) {
            jsonItem = {
                jsonName: jsonName,
                jsonAsset: jsonData
            }
            this.allExcelJson.push(jsonItem);
        }
        else {
            jsonItem.jsonAsset = jsonData;
        }
    }

    public getAllExcelJsons() {
        return this.allExcelJson;
    }

    //写入excel的多个字段
    public writeExcelJsonElements(writeInfo: { excelName: string, id: number, itemName: string, itemValue: any }[]) {
        if (!writeInfo || writeInfo.length === 0) {
            return;
        }
        writeInfo.forEach((item) => {
            const excelJson = this.getExcelJson(item.excelName);
            if (!excelJson) {
                return;
            }
            const excelName = item.excelName;
            const isStageExcel = ExcelConvert.getIsStageExcel(excelName);
            let resDat = item.itemValue;
            let mainKey = item.id;
            if (isStageExcel) {
                mainKey = EditorSetting.Instance.getStageId();
                resDat = StageExcelConvert.exportStrToExcelDat(item.id, item.itemName, resDat);
            }
            if (!excelJson[mainKey]) {
                excelJson[mainKey] = {};
            }
            excelJson[mainKey][item.itemName] = resDat;
        });
    }

    //写入一个字段
    public writeExcelJsonElement(excelName: string, key: number, itemName: string, itemValue: any) {
        const excelJson = this.getExcelJson(excelName);
        if (!excelJson) {
            return;
        }
        if (!excelJson[key]) excelJson[key] = {};
        excelJson[key][itemName] = itemValue;
    }


    //检测房间是否重名
    public checkRoomDuplicate(newCfgId: number) {
        const roomJson = this.getExcelJson("AreaBase");
        const hasRoom = !!roomJson[newCfgId];
        return hasRoom;
    }

}
