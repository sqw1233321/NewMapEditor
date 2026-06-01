// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { ResLoader } from "../../frameWork/ResLoader";

const { ccclass, property } = cc._decorator;

//动态json获取（TODO:后续这些json会放到外壳中，获取外部生成的接送）
@ccclass
export default class DynamicGetter extends cc.Component {

    @property(cc.JsonAsset)
    attrSetting: cc.JsonAsset;

    @property(cc.JsonAsset)
    itemSetting: cc.JsonAsset;

    @property(cc.SpriteFrame)
    defaultSp: cc.SpriteFrame;

    static Ins: DynamicGetter

    protected onLoad(): void {
        DynamicGetter.Ins = this;
    }

    public getAttrSetting(): any {
        return this.attrSetting.json;
    }
    public getItemSetting(): any {
        return this.itemSetting.json;
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

    public getItemAnchor(type) {
        const settings = DynamicGetter.Ins.getItemSetting();
        const setting = settings.find((t: any) => t.ClassName === type);
        if (setting) {
            return setting.itemAnchor;
        }
        return [0.5, 0.5];
    }

    public getGroupIndex(type) {
        const settings = DynamicGetter.Ins.getItemSetting();
        const setting = settings.find((t: any) => t.ClassName === type);
        if (setting) {
            return setting.cameraGroupIndex;
        }
        return 0;
    }

    public getDefaultSp(): cc.SpriteFrame {
        return this.defaultSp;
    }

}
