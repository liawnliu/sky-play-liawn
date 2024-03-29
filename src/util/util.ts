/**
 * @file 一些可能会用得到的扩展方法
 * @version 1.0.0
 * @author ZingYao <ZingYao@yeah.net>
 */

import { NotFoundError } from "ui_selector";

/**
 * 一些工具类方法
 * @version 1.0.0
 * @author ZingYao <ZingYao@yeah.net>
 */
class Utils {
    //当前应用context
    private context = $autojs.androidContext
    //Android的wifi管理工具类
    private wifiManager = this.context.getSystemService("wifi");
    //Android的电源管理工具类
    private powerManager = this.context.getSystemService("power")
    //保持CPU运行，允许保持屏幕显示（可能降低亮度），允许关闭键盘灯
    private wakeLock = this.powerManager.newWakeLock(6,"WakeLock")
    /**
     * 获取wifi是否连接的状态 true已连接 false未连接
     * @returns {boolean} wifi是否已连接 
     * @version 1.0.0
     * @author ZingYao <ZingYao@yeah.net>
     */
    public getWifiIsConnect = (): boolean => {
        const wifiInfo = this.wifiManager.getConnectionInfo();
        const intIp = wifiInfo.getIpAddress()
        return intIp != 0;
    }

    /**
     * 获取wifi ip地址,wifi未连接则返回0
     * @returns {number} wifi的ip地址
     * @version 1.0.0
     * @author ZingYao <ZingYao@yeah.net>
     */
    public getWifiIpAddr = (): number => {
        const wifiInfo = this.wifiManager.getConnectionInfo();
        const intIp = wifiInfo.getIpAddress()
        return intIp;
    }

    /**
     * number 类型ip地址转换为string类型ip地址
     * @param {number} ip 
     * @returns {string} 字符串ip地址
     * @version 1.0.0
     * @author ZingYao <ZingYao@yeah.net>
     */
    public intToip = (ip: number): string => {
        var arr = new Array();
        arr[0] = (ip >>> 24) >>> 0;
        arr[1] = ((ip << 8) >>> 24) >>> 0;
        arr[2] = (ip << 16) >>> 24;
        arr[3] = (ip << 24) >>> 24;
        return String(arr[3]) + "." + String(arr[2]) + "." + String(arr[1]) + "." + String(arr[0]);
    }

    /**
     * 修改屏幕常亮，关闭常亮
     * @param {boolean} state | true 常亮 | false 关闭常亮
     * @returns {void} nothing
     * @version 1.0.0
     * @author ZingYao <ZingYao@yeah.net>
     */
    public changeScreenState = (state :boolean) => {
        if (state) {
            this.wakeLock.acquire();
        } else {
            this.wakeLock.release();
        }
    }
    public selectFrom(lower: number, upper: number) {
        var choices = upper - lower + 1; // 加1的原因是结果可以等于upper，需要“加一”并配合“向下取整”
        return Math.floor(Math.random() * choices + lower); // 加lower自然是因为最后的区间从lower开始的
    }
    public throttle = (fn: Function, wait: number, params?: Object) => {
        let timer: NodeJS.Timeout | null = null;
        return function () {
            if (timer == null) {
                timer = setTimeout(() => {
                    // 这里的this和arguments就是return function这个函数的this和arguments
                    //（箭头函数没有自己的this，arguments，super或new.target）
                    fn && fn.apply(null, Array.prototype.slice.apply(arguments).concat(params));
                    timer = null;
                }, wait);
            }
        };
    }
    public defaultEquals<T>(a: T, b: T): boolean {
        return a === b;
    }
}
const utils = new Utils()

export default utils as Utils