import { Singleton } from "./Singleton";

export default class SpriteManager extends Singleton<SpriteManager> {
    //地图数据map：相对路径，图片
    private _spriteDatMap: Map<string, cc.SpriteFrame> = new Map();

    public static get instance(): SpriteManager {
        return super.instance as SpriteManager;
    }

    public async loadSprite(relativePath: string): Promise<cc.SpriteFrame> {
        if (this._spriteDatMap.has(relativePath)) {
            return this._spriteDatMap.get(relativePath);
        }
        let spriteFrame: cc.SpriteFrame;
        if (!CC_BUILD) {
            const resourcePath = relativePath.replace(/\.[^.]+$/, '');
            spriteFrame = await new Promise<cc.SpriteFrame>((resolve, reject) => {
                cc.resources.load(resourcePath, cc.SpriteFrame, null, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            const result = await window.electronAPI.loadSingleSprite(relativePath);
            if (!result.success) {
                throw new Error(result.error);
            }
            spriteFrame = await this.createSpriteFromBase64(result.data);
        }
        this._spriteDatMap.set(relativePath, spriteFrame);
        return spriteFrame;
    }

    //将图片从base64转化为cocos资源
    private async createSpriteFromBase64(base64Data: string): Promise<cc.SpriteFrame> {
        return new Promise<cc.SpriteFrame>((resolve, reject) => {
            const texture = new cc.Texture2D();
            const img = new Image();
            img.onload = () => {
                texture.initWithElement(img);
                const frame = new cc.SpriteFrame();
                frame.setTexture(texture);
                resolve(frame);
            };
            img.onerror = () => {
                reject(new Error(`图片加载失败: ${base64Data.slice(0, 50)}...`));
            };
            img.src = base64Data;
        });
    }

}
