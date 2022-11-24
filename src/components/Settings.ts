import { DATA_STORE_NAME, DATA_STORE_SETTINGS } from '@/config/params';
import { createDatastore } from 'datastore';

const datastore = createDatastore(DATA_STORE_NAME);

export type SettingsType = {
  entryPosition: number,
  immediatelyPlay: boolean,
  intellectOpen: boolean,
  adbMode: boolean
}

export default class Settings {
  // 单例模式
  private static _instance: Settings | null;
  public static settings: SettingsType | undefined;
  public static get I(): Settings {
    return this._instance
      ? this._instance
      : (this._instance = new Settings());
  }
  private constructor() { }
  // 待实现UI
  public init() {}
  // 暂时用代码来修改设置
  public async initSettings() {
    const contain = await datastore.contains(DATA_STORE_SETTINGS)
    if (!contain) {
      const settings: SettingsType = {
        entryPosition: 0, // 0表示左边，1表示右边
        immediatelyPlay: true, // 选择开始，会弹出播放控件，一般是手动点击播放，这里我们暂时选择进入就立即播放
        intellectOpen: false, // 智能地打开音乐弹奏的界面（暂时用的无障碍，没有用adb，所以打开这个功能时确保在无障碍模式运行）
        adbMode: true // 采取无障碍服务的模式还是ADB的模式
      };
      await datastore.set(DATA_STORE_SETTINGS, settings)
    }
  }
  public static async getSettings(): Promise<SettingsType | undefined> {
    if (Settings.settings) {
      return Settings.settings;
    }
    const settings = await datastore.get(DATA_STORE_SETTINGS);
    return (Settings.settings = settings as SettingsType)
  }
  public static async clearSettings() {
    Settings.settings = undefined;
    await datastore.clear();
  }
}