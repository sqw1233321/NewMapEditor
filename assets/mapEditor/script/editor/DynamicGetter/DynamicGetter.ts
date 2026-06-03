import { AttrCfgDropDownType } from "../../type/mapTypes";

const { ccclass, property } = cc._decorator;

//动态json获取（TODO:后续这些json会放到外壳中，获取外部生成的接送）
@ccclass
export default class DynamicGetter extends cc.Component {
    @property(cc.SpriteFrame)
    defaultSp: cc.SpriteFrame;

    static Ins: DynamicGetter

    protected onLoad(): void {
        DynamicGetter.Ins = this;
    }

    public async loadDynamicJson() {
        //debug模式使用resource加载
        if (!CC_BUILD) {
            const loadDir = (dir: string): Promise<cc.JsonAsset[]> => {
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
            try {
                const [editorAssets, outerAssets] = await Promise.all([
                    loadDir('editorJsonAssets'),
                    loadDir('outerJsonAssets'),
                ]);
                // 如果需要统一处理
                const allJsonAssets = [...editorAssets, ...outerAssets];
                console.log('加载完成:', allJsonAssets.map(a => a.name));
                allJsonAssets.forEach((asset) => {
                    this[asset.name] = asset;
                });
                console.log(this);
            } catch (err) {
                console.error('[DynamicGetter] 加载失败:', err);
            }
        }
        //node运行使用node加载
        else {
            const loaders = [
                ['jsonAssets/attrSetting.json', 'attrSetting'],
                ['jsonAssets/itemSetting.json', 'itemSetting'],
                ['jsonAssets/dropDownSetting.json', 'dropDownSetting'],
            ];
            await Promise.all(
                loaders.map(([fileName, propName]) =>
                    window.electronAPI.readFile(fileName).then((result: any) => {
                        if (!result.success) {
                            console.warn(`[DynamicGetter] ${fileName} 加载失败:`, result.error);
                            return false;
                        }
                        this[propName] = {};
                        this[propName].json = JSON.parse(result.content);
                        return true;
                    })
                )
            );
        }
    }


    public getAttrSetting(): any {
        return this["attrSetting"].json;
    }

    public getItemSetting(): any {
        return this["itemSetting"].json;
    }

    public getDropDownSetting(): any {
        return this["dropDownSetting"].json;
    }

    public getExcelJson(jsonName: string) {
        return this[jsonName]?.json;
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

    public getDefaultSp(): cc.SpriteFrame {
        return this.defaultSp;
    }

    public getDropSettingByName(propertiesName: string): AttrCfgDropDownType[] {
        const settings = DynamicGetter.Ins.getDropDownSetting();
        const setting = settings[`${propertiesName}`];
        if (setting) {
            return setting;
        }
        return null;
    }

    public getDropSettingIntemByValue(settings: AttrCfgDropDownType[], value): AttrCfgDropDownType {
        //注意string和number
        const item = settings.find((t: AttrCfgDropDownType) => t.exportValue === value);
        if (item) {
            return item;
        }
        return null;
    }

}
